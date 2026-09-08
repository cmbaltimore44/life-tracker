import * as projectsApi from '../data/projects.js';
import * as projectTasksApi from '../data/projectTasks.js';
import { hashSegments } from '../hash.js';

const STATUS_LABELS = { not_started: 'Not Started', in_progress: 'In Progress', done: 'Done' };

let userId = null;
let projects = [];
let checklist = [];
let currentProjectId = null;

const el = {};

function cacheElements() {
  Object.assign(el, {
    listPanel: document.getElementById('projects-list-panel'),
    detailPanel: document.getElementById('projects-detail-panel'),
    projectsList: document.getElementById('projects-list'),
    projectCount: document.getElementById('project-count'),
    newProjectBtn: document.getElementById('new-project-btn'),

    name: document.getElementById('project-name'),
    status: document.getElementById('project-status'),
    targetDate: document.getElementById('project-target-date'),
    notes: document.getElementById('project-notes'),
    saveBtn: document.getElementById('save-project-btn'),
    deleteBtn: document.getElementById('delete-project-btn'),

    checklist: document.getElementById('project-checklist'),
    checklistForm: document.getElementById('project-checklist-form'),
  });
}

function showError(err) {
  console.error(err);
  alert(err.message || 'Something went wrong talking to the server.');
}

function renderList() {
  el.projectsList.innerHTML = '';
  el.projectCount.textContent = projects.length
    ? `${projects.length} project${projects.length === 1 ? '' : 's'}`
    : '';

  if (projects.length === 0) {
    const hint = document.createElement('div');
    hint.className = 'empty-hint';
    hint.textContent = 'No projects yet — create one to get started.';
    el.projectsList.appendChild(hint);
    return;
  }

  projects.forEach((project) => {
    const row = document.createElement('div');
    row.className = 'project-row';

    const name = document.createElement('div');
    name.className = 'project-row-name';
    name.textContent = project.name;
    row.appendChild(name);

    const status = document.createElement('span');
    status.className = 'project-row-status ' + project.status;
    status.textContent = STATUS_LABELS[project.status];
    row.appendChild(status);

    row.addEventListener('click', () => {
      location.hash = '#/projects/' + project.id;
    });

    el.projectsList.appendChild(row);
  });
}

function renderChecklist() {
  el.checklist.innerHTML = '';
  checklist.forEach((item) => {
    const row = document.createElement('li');
    row.className = 'routine-row' + (item.done ? ' completed' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'routine-check';
    checkbox.checked = item.done;
    checkbox.addEventListener('change', async () => {
      try {
        item.done = checkbox.checked;
        await projectTasksApi.updateProjectTask(item.id, { done: item.done });
        renderChecklist();
      } catch (err) {
        showError(err);
      }
    });
    row.appendChild(checkbox);

    const name = document.createElement('span');
    name.className = 'routine-name';
    name.textContent = item.title;
    row.appendChild(name);

    const remove = document.createElement('button');
    remove.className = 'routine-remove';
    remove.type = 'button';
    remove.textContent = '×';
    remove.addEventListener('click', async () => {
      try {
        await projectTasksApi.deleteProjectTask(item.id);
        checklist = checklist.filter((c) => c.id !== item.id);
        renderChecklist();
      } catch (err) {
        showError(err);
      }
    });
    row.appendChild(remove);

    el.checklist.appendChild(row);
  });
}

async function openDetail(id) {
  if (id === currentProjectId) return; // already showing this project — don't clobber in-progress edits
  currentProjectId = id;
  let project = projects.find((p) => p.id === id);
  try {
    if (!project) project = await projectsApi.getProject(id);
    checklist = await projectTasksApi.listProjectTasks(id);
  } catch (err) {
    showError(err);
    location.hash = '#/projects';
    return;
  }

  el.name.value = project.name;
  el.status.value = project.status;
  el.targetDate.value = project.target_date || '';
  el.notes.value = project.notes || '';
  renderChecklist();
}

async function handleSave() {
  const fields = {
    name: el.name.value.trim() || 'Untitled Project',
    status: el.status.value,
    target_date: el.targetDate.value || null,
    notes: el.notes.value.trim() || null,
  };
  try {
    const updated = await projectsApi.updateProject(currentProjectId, fields);
    const index = projects.findIndex((p) => p.id === currentProjectId);
    if (index >= 0) projects[index] = updated;
    location.hash = '#/projects';
  } catch (err) {
    showError(err);
  }
}

async function handleDelete() {
  if (!currentProjectId) return;
  try {
    await projectsApi.deleteProject(currentProjectId);
    projects = projects.filter((p) => p.id !== currentProjectId);
    location.hash = '#/projects';
  } catch (err) {
    showError(err);
  }
}

async function handleNewProject() {
  try {
    const created = await projectsApi.createProject(
      userId,
      { name: 'Untitled Project', status: 'not_started' },
      projects.length
    );
    projects.unshift(created);
    location.hash = '#/projects/' + created.id;
  } catch (err) {
    showError(err);
  }
}

async function handleAddChecklistItem(e) {
  e.preventDefault();
  const input = el.checklistForm.querySelector('input');
  const title = input.value.trim();
  if (!title) return;
  try {
    const created = await projectTasksApi.createProjectTask(userId, currentProjectId, title, checklist.length);
    checklist.push(created);
    input.value = '';
    renderChecklist();
  } catch (err) {
    showError(err);
  }
}

function renderRoute() {
  const segments = hashSegments();
  if (segments[0] !== 'projects') return;
  const id = segments[1];
  el.listPanel.hidden = !!id;
  el.detailPanel.hidden = !id;
  if (id) {
    openDetail(id);
  } else {
    currentProjectId = null;
  }
}

export async function initProjects(uid) {
  userId = uid;
  cacheElements();

  el.newProjectBtn.addEventListener('click', handleNewProject);
  el.saveBtn.addEventListener('click', handleSave);
  el.deleteBtn.addEventListener('click', handleDelete);
  el.checklistForm.addEventListener('submit', handleAddChecklistItem);
  window.addEventListener('hashchange', renderRoute);

  await refreshProjects();
  renderRoute();
}

export async function refreshProjects() {
  try {
    projects = await projectsApi.listProjects();
  } catch (err) {
    showError(err);
    return;
  }
  renderList();
  const segments = hashSegments();
  if (segments[0] === 'projects' && segments[1]) openDetail(segments[1]);
}
