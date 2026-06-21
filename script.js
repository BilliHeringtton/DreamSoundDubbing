import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    collection, 
    deleteDoc,
    updateDoc,
    onSnapshot,
    query,
    where,
    arrayUnion,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ===== КОНФИГ FIREBASE =====
const firebaseConfig = {
    apiKey: "AIzaSyDdSMty86vdN5xxz_KNQOqRbPXz-Im65Kw",
    authDomain: "dream-sound-dubbung.firebaseapp.com",
    projectId: "dream-sound-dubbung",
    storageBucket: "dream-sound-dubbung.firebasestorage.app",
    messagingSenderId: "485510639860",
    appId: "1:485510639860:web:ff49a533c91bd6a91e6ea1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== УПРАВЛЕНИЕ АДМИНИСТРАТОРАМИ =====
const ADMINS_DOC = 'admins';
const ADMINS_COLLECTION = 'config';

// ⭐ ПЕРВЫЙ АДМИНИСТРАТОР (автоматически добавится при запуске)
const FIRST_ADMIN_EMAIL = 'Maks2010karp@gmail.com';

// Получить список администраторов
async function getAdminsList() {
    try {
        const docRef = doc(db, ADMINS_COLLECTION, ADMINS_DOC);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().emails || [];
        }
        return [];
    } catch (error) {
        console.error('Ошибка получения списка администраторов:', error);
        return [];
    }
}

// ⭐ АВТОМАТИЧЕСКОЕ ДОБАВЛЕНИЕ ПЕРВОГО АДМИНИСТРАТОРА
async function initializeFirstAdmin() {
    try {
        const docRef = doc(db, ADMINS_COLLECTION, ADMINS_DOC);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            // Документа нет - создаём с первым админом
            await setDoc(docRef, {
                emails: [FIRST_ADMIN_EMAIL]
            });
            console.log(`✅ Администратор ${FIRST_ADMIN_EMAIL} добавлен в базу!`);
        } else {
            const admins = docSnap.data().emails || [];
            if (!admins.includes(FIRST_ADMIN_EMAIL)) {
                // Добавляем админа, если его ещё нет
                await updateDoc(docRef, {
                    emails: arrayUnion(FIRST_ADMIN_EMAIL)
                });
                console.log(`✅ Администратор ${FIRST_ADMIN_EMAIL} добавлен в список!`);
            } else {
                console.log(`ℹ️ Администратор ${FIRST_ADMIN_EMAIL} уже есть в списке`);
            }
        }
    } catch (error) {
        console.error('❌ Ошибка инициализации администратора:', error);
    }
}

// Проверить, является ли пользователь администратором
async function checkIfAdmin(user) {
    if (!user) return false;
    const admins = await getAdminsList();
    return admins.includes(user.email);
}

// Добавить администратора
async function addAdmin(email) {
    try {
        const docRef = doc(db, ADMINS_COLLECTION, ADMINS_DOC);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            await updateDoc(docRef, {
                emails: arrayUnion(email)
            });
        } else {
            await setDoc(docRef, {
                emails: [email]
            });
        }
        return { success: true, message: `✅ ${email} теперь администратор!` };
    } catch (error) {
        return { success: false, message: '❌ Ошибка: ' + error.message };
    }
}

// Удалить администратора
async function removeAdmin(email) {
    try {
        const docRef = doc(db, ADMINS_COLLECTION, ADMINS_DOC);
        await updateDoc(docRef, {
            emails: arrayRemove(email)
        });
        return { success: true, message: `✅ ${email} больше не администратор` };
    } catch (error) {
        return { success: false, message: '❌ Ошибка: ' + error.message };
    }
}

// ===== DOM ЭЛЕМЕНТЫ =====
// Авторизация
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const errorMessage = document.getElementById('errorMessage');

// Меню
const menuToggle = document.getElementById('menuToggle');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const sideMenu = document.getElementById('sideMenu');
const overlay = document.getElementById('overlay');
const logoutBtn = document.getElementById('logoutBtn');
const adminMenuSection = document.getElementById('adminMenuSection');

// Страницы
const authPage = document.getElementById('authPage');
const homePage = document.getElementById('homePage');
const mediaPage = document.getElementById('mediaPage');
const profilePage = document.getElementById('profilePage');
const adminPage = document.getElementById('adminPage');

// Профиль
const profileName = document.getElementById('profileName');
const profilePhotoURL = document.getElementById('profilePhotoURL');
const profileEmail = document.getElementById('profileEmail');
const profileAvatar = document.getElementById('profileAvatar');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const profileMessage = document.getElementById('profileMessage');

// Контейнеры для контента
const teamContainer = document.getElementById('teamContainer');
const projectsContainer = document.getElementById('projectsContainer');
const projectsAdminList = document.getElementById('projectsAdminList');
const membersAdminList = document.getElementById('membersAdminList');
const adminsList = document.getElementById('adminsList');

// Админ-форма для администраторов
const adminEmailInput = document.getElementById('adminEmailInput');
const addAdminBtn = document.getElementById('addAdminBtn');

// Админ-форма для проектов
const projectTitle = document.getElementById('projectTitle');
const projectType = document.getElementById('projectType');
const projectYear = document.getElementById('projectYear');
const projectIcon = document.getElementById('projectIcon');
const addProjectBtn = document.getElementById('addProjectBtn');

// Админ-форма для команды
const memberName = document.getElementById('memberName');
const memberRole = document.getElementById('memberRole');
const memberEmoji = document.getElementById('memberEmoji');
const addMemberBtn = document.getElementById('addMemberBtn');

// Все кнопки меню
const menuBtns = document.querySelectorAll('.menu-btn[data-page]');

// ===== ФУНКЦИИ НАВИГАЦИИ =====
function showPage(pageId) {
    // Скрываем ВСЕ страницы
    [authPage, homePage, mediaPage, profilePage, adminPage].forEach(p => p.classList.add('hidden'));
    
    // Показываем нужную
    const pageMap = {
        'home': homePage,
        'media': mediaPage,
        'profile': profilePage,
        'admin': adminPage
    };
    
    if (pageMap[pageId]) {
        pageMap[pageId].classList.remove('hidden');
    }
}

function closeMenu() {
    sideMenu.classList.remove('open');
    overlay.classList.add('hidden');
}

function openMenu() {
    sideMenu.classList.add('open');
    overlay.classList.remove('hidden');
}

// ===== СОБЫТИЯ МЕНЮ =====
menuToggle.addEventListener('click', openMenu);
closeMenuBtn.addEventListener('click', closeMenu);
overlay.addEventListener('click', closeMenu);

menuBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        showPage(page);
        closeMenu();
    });
});

// ===== АВТОРИЗАЦИЯ =====
loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    signInWithEmailAndPassword(auth, email, password)
        .catch(() => {
            errorMessage.textContent = '❌ Неверный логин или пароль!';
        });
});

registerBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    createUserWithEmailAndPassword(auth, email, password)
        .catch((error) => {
            errorMessage.textContent = '❌ Ошибка: ' + error.message;
        });
});

logoutBtn.addEventListener('click', () => {
    signOut(auth);
    closeMenu();
});

// ===== СОХРАНЕНИЕ ПРОФИЛЯ =====
saveProfileBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    const name = profileName.value.trim();
    const photo = profilePhotoURL.value.trim();
    
    try {
        await updateProfile(user, {
            displayName: name || undefined,
            photoURL: photo || undefined
        });
        
        if (photo) {
            profileAvatar.src = photo;
        } else if (name) {
            profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=128`;
        }
        
        profileMessage.textContent = '✅ Профиль успешно обновлён!';
        profileMessage.className = 'profile-message success';
    } catch (error) {
        profileMessage.textContent = '❌ Ошибка при обновлении: ' + error.message;
        profileMessage.className = 'profile-message error';
    }
    
    setTimeout(() => {
        profileMessage.textContent = '';
        profileMessage.className = 'profile-message';
    }, 3000);
});

// ===== ЗАГРУЗКА ПРОЕКТОВ ИЗ FIRESTORE =====
function renderProjects(projects) {
    projectsContainer.innerHTML = '';
    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <span class="project-icon">${project.icon || '🎬'}</span>
            <h3>${project.title}</h3>
            <p class="project-type">${project.type}</p>
            <p class="project-year">📅 ${project.year}</p>
        `;
        projectsContainer.appendChild(card);
    });

    projectsAdminList.innerHTML = '';
    projects.forEach(project => {
        const item = document.createElement('div');
        item.className = 'admin-item';
        item.innerHTML = `
            <div class="admin-item-info">
                <span>${project.icon || '🎬'} ${project.title}</span>
                <span class="admin-item-sub">${project.type} (${project.year})</span>
            </div>
            <div class="admin-item-actions">
                <button class="btn small-btn edit-btn" data-id="${project.id}">✏️</button>
                <button class="btn small-btn delete-btn" data-id="${project.id}">🗑️</button>
            </div>
        `;
        projectsAdminList.appendChild(item);

        item.querySelector('.edit-btn').addEventListener('click', () => editProject(project.id));
        item.querySelector('.delete-btn').addEventListener('click', () => deleteProject(project.id));
    });
}

function renderMembers(members) {
    teamContainer.innerHTML = '';
    members.forEach(member => {
        const card = document.createElement('div');
        card.className = 'team-card';
        card.innerHTML = `
            <span class="team-emoji">${member.emoji || '👤'}</span>
            <h3>${member.name}</h3>
            <p>${member.role}</p>
        `;
        teamContainer.appendChild(card);
    });

    membersAdminList.innerHTML = '';
    members.forEach(member => {
        const item = document.createElement('div');
        item.className = 'admin-item';
        item.innerHTML = `
            <div class="admin-item-info">
                <span>${member.emoji || '👤'} ${member.name}</span>
                <span class="admin-item-sub">${member.role}</span>
            </div>
            <div class="admin-item-actions">
                <button class="btn small-btn edit-btn" data-id="${member.id}">✏️</button>
                <button class="btn small-btn delete-btn" data-id="${member.id}">🗑️</button>
            </div>
        `;
        membersAdminList.appendChild(item);

        item.querySelector('.edit-btn').addEventListener('click', () => editMember(member.id));
        item.querySelector('.delete-btn').addEventListener('click', () => deleteMember(member.id));
    });
}

function renderAdmins(admins, currentUserEmail) {
    adminsList.innerHTML = '';
    admins.forEach(email => {
        const item = document.createElement('div');
        item.className = 'admin-item';
        const isCurrentUser = email === currentUserEmail;
        const isFirstAdmin = email === FIRST_ADMIN_EMAIL;
        item.innerHTML = `
            <div class="admin-item-info">
                <span>${email} ${isFirstAdmin ? '⭐' : ''}</span>
                <span class="admin-item-sub">${isCurrentUser ? '👑 Это вы' : ''} ${isFirstAdmin && !isCurrentUser ? '🔒 Первый администратор' : ''}</span>
            </div>
            <div class="admin-item-actions">
                ${!isCurrentUser ? `<button class="btn small-btn delete-btn" data-email="${email}">🗑️ Удалить</button>` : ''}
            </div>
        `;
        adminsList.appendChild(item);

        if (!isCurrentUser) {
            item.querySelector('.delete-btn').addEventListener('click', async () => {
                if (confirm(`Вы уверены, что хотите удалить администратора ${email}?`)) {
                    const result = await removeAdmin(email);
                    alert(result.message);
                    if (result.success) {
                        await loadAdmins();
                    }
                }
            });
        }
    });
}

// ===== ЗАГРУЗКА АДМИНИСТРАТОРОВ =====
async function loadAdmins() {
    try {
        const admins = await getAdminsList();
        const user = auth.currentUser;
        renderAdmins(admins, user ? user.email : null);
    } catch (error) {
        console.error('Ошибка загрузки администраторов:', error);
    }
}

// ===== СЛУШАТЕЛИ FIRESTORE (реальное время) =====
let projectsData = [];
let membersData = [];

onSnapshot(collection(db, 'projects'), (snapshot) => {
    projectsData = [];
    snapshot.forEach(doc => {
        projectsData.push({ id: doc.id, ...doc.data() });
    });
    renderProjects(projectsData);
});

onSnapshot(collection(db, 'team'), (snapshot) => {
    membersData = [];
    snapshot.forEach(doc => {
        membersData.push({ id: doc.id, ...doc.data() });
    });
    renderMembers(membersData);
});

// Слушатель для администраторов
onSnapshot(doc(db, ADMINS_COLLECTION, ADMINS_DOC), async (docSnap) => {
    if (docSnap.exists()) {
        const admins = docSnap.data().emails || [];
        const user = auth.currentUser;
        renderAdmins(admins, user ? user.email : null);
    }
});

// ===== АДМИН-ФУНКЦИИ =====

// Добавление администратора
addAdminBtn.addEventListener('click', async () => {
    const email = adminEmailInput.value.trim();
    if (!email) {
        alert('Пожалуйста, введите email!');
        return;
    }

    if (!email.includes('@') || !email.includes('.')) {
        alert('Пожалуйста, введите корректный email!');
        return;
    }

    const result = await addAdmin(email);
    alert(result.message);
    if (result.success) {
        adminEmailInput.value = '';
        await loadAdmins();
    }
});

// Админ-функции для проектов
async function addProject() {
    const title = projectTitle.value.trim();
    const type = projectType.value.trim();
    const year = projectYear.value.trim();
    const icon = projectIcon.value.trim() || '🎬';

    if (!title || !type || !year) {
        alert('Пожалуйста, заполните все поля!');
        return;
    }

    try {
        const newDoc = doc(collection(db, 'projects'));
        await setDoc(newDoc, {
            title,
            type,
            year,
            icon,
            createdAt: new Date().toISOString()
        });

        projectTitle.value = '';
        projectType.value = '';
        projectYear.value = '';
        projectIcon.value = '';
        
        alert('✅ Проект добавлен!');
    } catch (error) {
        alert('❌ Ошибка: ' + error.message);
    }
}

async function editProject(id) {
    const project = projectsData.find(p => p.id === id);
    if (!project) return;

    const newTitle = prompt('Название проекта:', project.title);
    if (newTitle === null) return;
    const newType = prompt('Тип проекта:', project.type);
    if (newType === null) return;
    const newYear = prompt('Год:', project.year);
    if (newYear === null) return;
    const newIcon = prompt('Эмодзи:', project.icon || '🎬');
    if (newIcon === null) return;

    try {
        await updateDoc(doc(db, 'projects', id), {
            title: newTitle.trim(),
            type: newType.trim(),
            year: newYear.trim(),
            icon: newIcon.trim() || '🎬'
        });
        alert('✅ Проект обновлён!');
    } catch (error) {
        alert('❌ Ошибка: ' + error.message);
    }
}

async function deleteProject(id) {
    if (!confirm('Вы уверены, что хотите удалить этот проект?')) return;

    try {
        await deleteDoc(doc(db, 'projects', id));
        alert('✅ Проект удалён!');
    } catch (error) {
        alert('❌ Ошибка: ' + error.message);
    }
}

// Админ-функции для команды
async function addMember() {
    const name = memberName.value.trim();
    const role = memberRole.value.trim();
    const emoji = memberEmoji.value.trim() || '👤';

    if (!name || !role) {
        alert('Пожалуйста, заполните все поля!');
        return;
    }

    try {
        const newDoc = doc(collection(db, 'team'));
        await setDoc(newDoc, {
            name,
            role,
            emoji,
            createdAt: new Date().toISOString()
        });

        memberName.value = '';
        memberRole.value = '';
        memberEmoji.value = '';
        
        alert('✅ Участник добавлен!');
    } catch (error) {
        alert('❌ Ошибка: ' + error.message);
    }
}

async function editMember(id) {
    const member = membersData.find(m => m.id === id);
    if (!member) return;

    const newName = prompt('Имя:', member.name);
    if (newName === null) return;
    const newRole = prompt('Роль:', member.role);
    if (newRole === null) return;
    const newEmoji = prompt('Эмодзи:', member.emoji || '👤');
    if (newEmoji === null) return;

    try {
        await updateDoc(doc(db, 'team', id), {
            name: newName.trim(),
            role: newRole.trim(),
            emoji: newEmoji.trim() || '👤'
        });
        alert('✅ Участник обновлён!');
    } catch (error) {
        alert('❌ Ошибка: ' + error.message);
    }
}

async function deleteMember(id) {
    if (!confirm('Вы уверены, что хотите удалить этого участника?')) return;

    try {
        await deleteDoc(doc(db, 'team', id));
        alert('✅ Участник удалён!');
    } catch (error) {
        alert('❌ Ошибка: ' + error.message);
    }
}

// ===== СОБЫТИЯ АДМИН-ФОРМ =====
addProjectBtn.addEventListener('click', addProject);
addMemberBtn.addEventListener('click', addMember);

// ===== ЗАПУСК ИНИЦИАЛИЗАЦИИ =====
// Запускаем автоматическое добавление первого администратора
initializeFirstAdmin();

// ===== ОТСЛЕЖИВАНИЕ СОСТОЯНИЯ АВТОРИЗАЦИИ =====
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const isAdmin = await checkIfAdmin(user);
        
        authPage.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
        
        if (isAdmin) {
            adminMenuSection.classList.remove('hidden');
            await loadAdmins();
        } else {
            adminMenuSection.classList.add('hidden');
        }
        
        showPage('home');
        
        profileName.value = user.displayName || '';
        profilePhotoURL.value = user.photoURL || '';
        profileEmail.value = user.email || '';
        
        if (user.photoURL) {
            profileAvatar.src = user.photoURL;
        } else if (user.displayName) {
            profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=7c3aed&color=fff&size=128`;
        }
    } else {
        authPage.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
        adminMenuSection.classList.add('hidden');
        
        [homePage, mediaPage, profilePage, adminPage].forEach(p => p.classList.add('hidden'));
        
        emailInput.value = '';
        passwordInput.value = '';
        errorMessage.textContent = '';
    }
});

// ===== ИНИЦИАЛИЗАЦИЯ =====
authPage.classList.remove('hidden');
[homePage, mediaPage, profilePage, adminPage].forEach(p => p.classList.add('hidden'));

console.log('🚀 Dream Sound Dubbing запущен!');
console.log('⭐ Первый администратор: Maks2010karp@gmail.com');
console.log('📧 В админ-панели можно назначать других администраторов');