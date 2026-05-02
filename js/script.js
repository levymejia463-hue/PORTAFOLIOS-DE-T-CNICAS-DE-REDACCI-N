document.addEventListener('DOMContentLoaded', function() {
    var navbar = document.getElementById('navbar');
    var hamburger = document.getElementById('hamburger');
    var navMenu = document.getElementById('nav-menu');
    var navLinks = document.querySelectorAll('.nav-link');
    var sections = document.querySelectorAll('.section, .hero');
    var indexHamburger = document.getElementById('index-hamburger');
    var indexSidebar = document.getElementById('index-sidebar');
    var sidebarCloseButtons = document.querySelectorAll('.sidebar-close');
    var sidebarOverlay = document.getElementById('sidebar-overlay');
    var sidebarLinks = document.querySelectorAll('.sidebar-link');
    var modalOverlay = document.getElementById('modal-overlay');
    var modalClose = document.getElementById('modal-close');

    var ADMIN_PASSWORD = 'admin123';
    var STORAGE_KEY = 'portafolio_data';

    var isAdmin = false;
    var currentWeekData = loadData();
    var currentWizardWeekKey = null;
    var editingWorkIndex = null;

    function loadData() {
        var stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                var data = JSON.parse(stored);
                Object.keys(data).forEach(function(key) {
                    if (!data[key].works) {
                        data[key] = {
                            weekNumber: parseInt(key.replace('semana', '')),
                            works: [{
                                title: data[key].title || 'Trabajo ' + key,
                                description: data[key].description || '',
                                fecha: data[key].fecha || 'Fecha pendiente',
                                pdfSrc: data[key].pdfSrc || ''
                            }]
                        };
                    }
                });
                return data;
            } catch (e) {
                console.error('Error loading data:', e);
            }
        }
        return {
            semana1: {
                weekNumber: 1,
                works: [{
                    title: 'Trabajo Semana 1',
                    description: 'En esta primera semana se abordaron los conceptos basicos.',
                    fecha: '15 de abril, 2026',
                    pdfSrc: 'assets/trabajo_semana1.pdf'
                }]
            }
        };
    }

    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentWeekData));
    }

    function fileToBase64(file) {
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = function() { resolve(reader.result); };
            reader.onerror = function(error) { reject(error); };
            reader.readAsDataURL(file);
        });
    }

    function rebuildUI() {
        var trabajosGrid = document.querySelector('.trabajos-grid');
        var sidebarMenu = document.querySelector('.sidebar-menu');
        trabajosGrid.innerHTML = '';
        sidebarMenu.innerHTML = '';

        Object.keys(currentWeekData).sort(function(a, b) {
            return currentWeekData[a].weekNumber - currentWeekData[b].weekNumber;
        }).forEach(function(weekKey) {
            var data = currentWeekData[weekKey];
            var weekNum = data.weekNumber;
            var mainWork = data.works[0];

            var card = document.createElement('div');
            card.className = 'trabajo-card';
            card.setAttribute('data-week', weekKey);
            card.innerHTML = '<div class="trabajo-week">Semana ' + weekNum + '</div>' +
                '<h3 class="trabajo-title">' + mainWork.title + '</h3>' +
                '<p class="trabajo-date">' + mainWork.fecha + '</p>' +
                (data.works.length > 1 ? '<small style="color:var(--gray);">+' + (data.works.length - 1) + ' trabajos mas</small>' : '');
            card.addEventListener('click', function() {
                openModal(weekKey, 0);
            });
            trabajosGrid.appendChild(card);

            var sidebarItem = document.createElement('li');
            sidebarItem.innerHTML = '<a href="#" class="sidebar-link" data-week="' + weekKey + '">Semana ' + weekNum + '</a>';
            sidebarMenu.appendChild(sidebarItem);
        });

        document.querySelectorAll('.sidebar-link').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var week = this.getAttribute('data-week');
                openModal(week, 0);
                closeSidebar();
            });
        });
    }

    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        var navbarHeight = navbar.offsetHeight;
        indexHamburger.style.top = (navbarHeight + 10) + 'px';

        var current = '';
        sections.forEach(function(section) {
            var sectionTop = section.offsetTop - 100;
            var sectionHeight = section.clientHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(function(link) {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });

    var navbarHeight = navbar.offsetHeight;
    indexHamburger.style.top = (navbarHeight + 10) + 'px';

    hamburger.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    navLinks.forEach(function(link) {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });

    indexHamburger.addEventListener('click', function() {
        indexSidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    function closeSidebar() {
        indexSidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    sidebarCloseButtons.forEach(function(btn) {
        btn.addEventListener('click', closeSidebar);
    });

    sidebarOverlay.addEventListener('click', closeSidebar);

    var currentWorkIndex = 0;

    function openModal(week, workIndex) {
        var modal = document.getElementById('work-modal');
        var title = modal.querySelector('h2');
        var weekBadge = modal.querySelector('.week-badge');
        var description = modal.querySelector('.modal-description p');
        var date = modal.querySelector('.date');
        var pdfContainer = modal.querySelector('.modal-pdf');
        var modalContent = modal.querySelector('.modal-content');

        if (currentWeekData[week]) {
            var data = currentWeekData[week];
            var workIdx = workIndex !== undefined ? workIndex : 0;
            var work = data.works[workIdx];
            currentWorkIndex = workIdx;

            title.textContent = work.title;
            weekBadge.textContent = 'Semana ' + data.weekNumber + ' - Trabajo ' + (workIdx + 1);
            description.textContent = work.description;
            date.textContent = work.fecha;

            pdfContainer.innerHTML = '';

            if (work.pdfSrc && work.pdfSrc !== '') {
                if (work.pdfSrc.startsWith('data:application/pdf')) {
                    var object = document.createElement('object');
                    object.data = work.pdfSrc;
                    object.type = 'application/pdf';
                    object.style.cssText = 'width:100%;height:500px;border:none;border-radius:4px;';

                    var fallback = document.createElement('p');
                    fallback.style.cssText = 'color:var(--gray);font-size:0.9rem;text-align:center;padding:20px;';
                    fallback.innerHTML = 'El PDF no se puede mostrar. <a href="#" onclick="event.preventDefault();window.open(\'' + work.pdfSrc + '\',\'_blank\');">Descargar aqui</a>.';
                    object.appendChild(fallback);
                    pdfContainer.appendChild(object);
                } else {
                    var frame = document.createElement('iframe');
                    frame.src = work.pdfSrc;
                    frame.style.cssText = 'width:100%;height:500px;border:none;border-radius:4px;';
                    pdfContainer.appendChild(frame);
                }
            } else {
                var p = document.createElement('p');
                p.style.cssText = 'color:var(--gray);font-size:0.9rem;text-align:center;padding:20px;';
                p.textContent = 'No hay PDF disponible.';
                pdfContainer.appendChild(p);
            }

            var existingNav = modalContent.querySelector('.work-nav');
            if (existingNav) existingNav.remove();

            if (data.works.length > 1) {
                var nav = document.createElement('div');
                nav.className = 'work-nav';
                nav.innerHTML = '<button class="btn-icon work-prev"' + (workIdx === 0 ? ' disabled' : '') + '>← Anterior</button>' +
                    '<span>' + (workIdx + 1) + ' / ' + data.works.length + '</span>' +
                    '<button class="btn-icon work-next"' + (workIdx === data.works.length - 1 ? ' disabled' : '') + '>Siguiente →</button>';

                modalContent.appendChild(nav);

                var prevBtn = nav.querySelector('.work-prev');
                var nextBtn = nav.querySelector('.work-next');

                if (workIdx > 0) {
                    prevBtn.addEventListener('click', function() {
                        openModal(week, currentWorkIndex - 1);
                    });
                }

                if (workIdx < data.works.length - 1) {
                    nextBtn.addEventListener('click', function() {
                        openModal(week, currentWorkIndex + 1);
                    });
                }
            }
        }

        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    modalClose.addEventListener('click', closeModal);

    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
            closeSidebar();
        }
    });

    rebuildUI();

    var adminLoginBtn = document.getElementById('admin-login-btn');
    var adminLoginModal = document.getElementById('admin-login-modal');
    var adminLoginClose = document.getElementById('admin-login-close');
    var adminPassword = document.getElementById('admin-password');
    var adminLoginSubmit = document.getElementById('admin-login-submit');
    var loginError = document.getElementById('login-error');

    var adminPanelModal = document.getElementById('admin-panel-modal');
    var adminPanelClose = document.getElementById('admin-panel-close');
    var adminLogout = document.getElementById('admin-logout');

    var addWeekModal = document.getElementById('add-week-modal');
    var addWeekClose = document.getElementById('add-week-close');

    var addWorkModal = document.getElementById('add-work-modal');
    var addWorkClose = document.getElementById('add-work-close');

    var adminTabs = document.querySelectorAll('.admin-tab');
    var tabContents = document.querySelectorAll('.admin-tab-content');

    adminLoginBtn.addEventListener('click', function() {
        if (isAdmin) {
            openAdminPanel();
        } else {
            adminLoginModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            adminPassword.focus();
        }
    });

    adminLoginClose.addEventListener('click', function() {
        adminLoginModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        adminPassword.value = '';
        loginError.classList.remove('show');
    });

    adminLoginSubmit.addEventListener('click', function() {
        if (adminPassword.value === ADMIN_PASSWORD) {
            isAdmin = true;
            adminLoginModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            adminPassword.value = '';
            loginError.classList.remove('show');
            adminLoginBtn.innerHTML = '<span class="admin-icon">⚙</span><span class="admin-text">Panel</span>';
            openAdminPanel();
        } else {
            loginError.classList.add('show');
            adminPassword.value = '';
        }
    });

    adminPassword.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            adminLoginSubmit.click();
        }
    });

    function openAdminPanel() {
        adminPanelModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        loadWeeksList();
        loadWorkWeekSelect();
        loadEditWeekSelect();
    }

    adminPanelClose.addEventListener('click', function() {
        adminPanelModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    adminLogout.addEventListener('click', function() {
        isAdmin = false;
        adminPanelModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        adminLoginBtn.innerHTML = '<span class="admin-icon">⚙</span><span class="admin-text">Admin</span>';
    });

    adminTabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            var targetTab = this.getAttribute('data-tab');

            adminTabs.forEach(function(t) { t.classList.remove('active'); });
            tabContents.forEach(function(c) { c.classList.remove('active'); });

            this.classList.add('active');
            document.getElementById('tab-' + targetTab).classList.add('active');
        });
    });

    function loadWeeksList() {
        var weeksList = document.getElementById('weeks-list');
        weeksList.innerHTML = '';

        var weekKeys = Object.keys(currentWeekData).sort(function(a, b) {
            return currentWeekData[a].weekNumber - currentWeekData[b].weekNumber;
        });

        if (weekKeys.length === 0) {
            weeksList.innerHTML = '<div class="empty-state">No hay semanas creadas</div>';
            return;
        }

        weekKeys.forEach(function(weekKey) {
            var data = currentWeekData[weekKey];
            var weekNum = data.weekNumber;

            var item = document.createElement('div');
            item.className = 'admin-list-item';
            item.innerHTML = '<div class="admin-list-item-info">' +
                '<h4>Semana ' + weekNum + '</h4>' +
                '<p>' + data.works.length + ' trabajo(s)</p>' +
                '</div>' +
                '<div class="admin-list-item-actions">' +
                '<button class="btn-icon delete" data-week="' + weekKey + '" title="Eliminar semana">&times;</button>' +
                '</div>';
            weeksList.appendChild(item);
        });

        weeksList.querySelectorAll('.btn-icon.delete').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var weekKey = this.getAttribute('data-week');
                if (confirm('¿Estas seguro de eliminar esta semana y todos sus trabajos?')) {
                    delete currentWeekData[weekKey];
                    saveData();
                    rebuildUI();
                    loadWeeksList();
                    loadWorkWeekSelect();
                    loadEditWeekSelect();
                }
            });
        });
    }

    document.getElementById('add-week-btn').addEventListener('click', function() {
        adminPanelModal.classList.remove('active');
        addWeekModal.classList.add('active');
        document.getElementById('new-week-number').value = '';
        document.getElementById('new-week-number').focus();
        showWizardStep(1);
    });

    addWeekClose.addEventListener('click', function() {
        addWeekModal.classList.remove('active');
        adminPanelModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    function showWizardStep(step) {
        document.querySelectorAll('.wizard-step').forEach(function(s) { s.classList.remove('active'); });
        var stepEl = document.querySelector('.wizard-step[data-step="' + step + '"]');
        if (stepEl) stepEl.classList.add('active');

        document.getElementById('wizard-step-1').style.display = step === 1 ? 'block' : 'none';
        document.getElementById('wizard-step-2').style.display = step === 2 ? 'block' : 'none';
        document.getElementById('wizard-step-3').style.display = step === 3 ? 'block' : 'none';
    }

    document.getElementById('save-week-btn').addEventListener('click', function() {
        var weekNum = document.getElementById('new-week-number').value;
        if (!weekNum || weekNum < 1) {
            alert('Ingresa un numero de semana valido');
            return;
        }

        var weekKey = 'semana' + weekNum;
        if (currentWeekData[weekKey]) {
            alert('Esta semana ya existe');
            return;
        }

        currentWeekData[weekKey] = {
            weekNumber: parseInt(weekNum),
            works: []
        };

        currentWizardWeekKey = weekKey;
        saveData();
        loadWeeksList();
        loadWorkWeekSelect();
        loadEditWeekSelect();

        document.getElementById('wizard-work-title').value = 'Trabajo Semana ' + weekNum;
        document.getElementById('wizard-work-description').value = '';
        document.getElementById('wizard-work-date').value = '';
        document.getElementById('wizard-work-pdf').value = '';
        document.getElementById('wizard-work-pdf-file').value = '';
        document.getElementById('wizard-file-preview').classList.remove('has-file');
        document.getElementById('wizard-file-preview').textContent = '';

        showWizardStep(2);
        document.getElementById('wizard-work-title').focus();
    });

    document.getElementById('wizard-work-pdf-file').addEventListener('change', function(e) {
        var file = e.target.files[0];
        var preview = document.getElementById('wizard-file-preview');

        if (file) {
            if (file.type !== 'application/pdf') {
                alert('Por favor selecciona un archivo PDF');
                this.value = '';
                preview.classList.remove('has-file');
                preview.textContent = '';
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                alert('El archivo es demasiado grande. Maximo 10MB');
                this.value = '';
                preview.classList.remove('has-file');
                preview.textContent = '';
                return;
            }

            preview.textContent = 'Archivo: ' + file.name + ' (' + (file.size / 1024).toFixed(2) + ' KB)';
            preview.classList.add('has-file');
        } else {
            preview.classList.remove('has-file');
            preview.textContent = '';
        }
    });

    document.getElementById('save-wizard-work-btn').addEventListener('click', async function() {
        var weekKey = currentWizardWeekKey;
        if (!weekKey || !currentWeekData[weekKey]) {
            alert('Error: No hay semana seleccionada');
            return;
        }

        var title = document.getElementById('wizard-work-title').value;
        var description = document.getElementById('wizard-work-description').value;
        var date = document.getElementById('wizard-work-date').value;
        var pdfInput = document.getElementById('wizard-work-pdf').value;
        var pdfFile = document.getElementById('wizard-work-pdf-file').files[0];

        if (!title) {
            alert('Ingresa un titulo para el trabajo');
            return;
        }

        var pdfSrc = '';

        if (pdfFile) {
            try {
                pdfSrc = await fileToBase64(pdfFile);
            } catch (error) {
                alert('Error al procesar el archivo PDF');
                return;
            }
        } else if (pdfInput) {
            pdfSrc = pdfInput.startsWith('assets/') ? pdfInput : 'assets/' + pdfInput;
        }

        currentWeekData[weekKey].works.push({
            title: title,
            description: description || 'Sin descripcion',
            fecha: date || 'Fecha pendiente',
            pdfSrc: pdfSrc
        });

        saveData();
        rebuildUI();
        loadWorksList(weekKey);
        loadEditWeekSelect();

        document.getElementById('wizard-work-title').value = '';
        document.getElementById('wizard-work-description').value = '';
        document.getElementById('wizard-work-date').value = '';
        document.getElementById('wizard-work-pdf').value = '';
        document.getElementById('wizard-work-pdf-file').value = '';
        document.getElementById('wizard-file-preview').classList.remove('has-file');
        document.getElementById('wizard-file-preview').textContent = '';

        showWizardStep(3);
    });

    document.getElementById('skip-work-btn').addEventListener('click', function() {
        showWizardStep(3);
    });

    document.getElementById('add-another-work-btn').addEventListener('click', function() {
        document.getElementById('wizard-work-title').value = '';
        document.getElementById('wizard-work-description').value = '';
        document.getElementById('wizard-work-date').value = '';
        document.getElementById('wizard-work-pdf').value = '';
        document.getElementById('wizard-work-pdf-file').value = '';
        document.getElementById('wizard-file-preview').classList.remove('has-file');
        document.getElementById('wizard-file-preview').textContent = '';
        showWizardStep(2);
        document.getElementById('wizard-work-title').focus();
    });

    document.getElementById('finish-wizard-btn').addEventListener('click', function() {
        addWeekModal.classList.remove('active');
        adminPanelModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        currentWizardWeekKey = null;
    });

    function loadWorkWeekSelect() {
        var select = document.getElementById('work-week-select');
        select.innerHTML = '';

        var weekKeys = Object.keys(currentWeekData).sort(function(a, b) {
            return currentWeekData[a].weekNumber - currentWeekData[b].weekNumber;
        });

        if (weekKeys.length === 0) {
            select.innerHTML = '<option value="">No hay semanas</option>';
            document.getElementById('works-list').innerHTML = '<div class="empty-state">Crea una semana primero</div>';
            return;
        }

        weekKeys.forEach(function(weekKey) {
            var weekNum = currentWeekData[weekKey].weekNumber;
            var option = document.createElement('option');
            option.value = weekKey;
            option.textContent = 'Semana ' + weekNum;
            select.appendChild(option);
        });

        loadWorksList(select.value);
    }

    document.getElementById('work-week-select').addEventListener('change', function() {
        loadWorksList(this.value);
    });

    function loadWorksList(weekKey) {
        var worksList = document.getElementById('works-list');
        worksList.innerHTML = '';

        if (!currentWeekData[weekKey]) {
            worksList.innerHTML = '<div class="empty-state">Selecciona una semana valida</div>';
            return;
        }

        var data = currentWeekData[weekKey];

        if (data.works.length === 0) {
            worksList.innerHTML = '<div class="empty-state">No hay trabajos en esta semana</div>';
            return;
        }

        data.works.forEach(function(work, index) {
            var hasPdf = work.pdfSrc && work.pdfSrc !== '';
            var pdfInfo = hasPdf ? (work.pdfSrc.startsWith('data:') ? 'PDF local' : work.pdfSrc) : 'Sin PDF';

            var item = document.createElement('div');
            item.className = 'admin-list-item';
            item.innerHTML = '<div class="admin-list-item-info">' +
                '<h4>' + work.title + (index > 0 ? ' (Trabajo ' + (index + 1) + ')' : '') + '</h4>' +
                '<p>' + work.fecha + '</p>' +
                '<small style="color:var(--gray);">' + pdfInfo + '</small>' +
                '</div>' +
                '<div class="admin-list-item-actions">' +
                '<button class="btn-icon edit" data-week="' + weekKey + '" data-index="' + index + '" title="Editar trabajo">✎</button>' +
                '<button class="btn-icon delete" data-week="' + weekKey + '" data-index="' + index + '" title="Eliminar trabajo">&times;</button>' +
                '</div>';
            worksList.appendChild(item);
        });

        worksList.querySelectorAll('.btn-icon.edit').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var weekKey = this.getAttribute('data-week');
                var workIndex = parseInt(this.getAttribute('data-index'));
                openEditWorkModal(weekKey, workIndex);
            });
        });

        worksList.querySelectorAll('.btn-icon.delete').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var weekKey = this.getAttribute('data-week');
                var workIndex = parseInt(this.getAttribute('data-index'));
                if (confirm('¿Estas seguro de eliminar este trabajo?')) {
                    currentWeekData[weekKey].works.splice(workIndex, 1);
                    saveData();
                    rebuildUI();
                    loadWorksList(weekKey);
                    loadEditWeekSelect();
                }
            });
        });
    }

    document.getElementById('add-work-btn').addEventListener('click', function() {
        var weekKey = document.getElementById('work-week-select').value;
        if (!weekKey || !currentWeekData[weekKey]) {
            alert('Selecciona una semana primero');
            return;
        }
        adminPanelModal.classList.remove('active');
        addWorkModal.classList.add('active');
        currentWizardWeekKey = weekKey;
        document.getElementById('add-work-title').value = '';
        document.getElementById('add-work-description').value = '';
        document.getElementById('add-work-date').value = '';
        document.getElementById('add-work-pdf').value = '';
        document.getElementById('add-work-pdf-file').value = '';
        document.getElementById('add-file-preview').classList.remove('has-file');
        document.getElementById('add-file-preview').textContent = '';
        document.getElementById('add-work-title').focus();
    });

    addWorkClose.addEventListener('click', function() {
        addWorkModal.classList.remove('active');
        adminPanelModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        currentWizardWeekKey = null;
    });

    document.getElementById('add-work-pdf-file').addEventListener('change', function(e) {
        var file = e.target.files[0];
        var preview = document.getElementById('add-file-preview');

        if (file) {
            if (file.type !== 'application/pdf') {
                alert('Por favor selecciona un archivo PDF');
                this.value = '';
                preview.classList.remove('has-file');
                preview.textContent = '';
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                alert('El archivo es demasiado grande. Maximo 10MB');
                this.value = '';
                preview.classList.remove('has-file');
                preview.textContent = '';
                return;
            }

            preview.textContent = 'Archivo: ' + file.name + ' (' + (file.size / 1024).toFixed(2) + ' KB)';
            preview.classList.add('has-file');
        } else {
            preview.classList.remove('has-file');
            preview.textContent = '';
        }
    });

    document.getElementById('save-add-work-btn').addEventListener('click', async function() {
        var weekKey = currentWizardWeekKey;
        if (!weekKey || !currentWeekData[weekKey]) {
            alert('Error: No hay semana seleccionada');
            return;
        }

        var title = document.getElementById('add-work-title').value;
        var description = document.getElementById('add-work-description').value;
        var date = document.getElementById('add-work-date').value;
        var pdfInput = document.getElementById('add-work-pdf').value;
        var pdfFile = document.getElementById('add-work-pdf-file').files[0];

        if (!title) {
            alert('Ingresa un titulo para el trabajo');
            return;
        }

        var pdfSrc = '';

        if (pdfFile) {
            try {
                pdfSrc = await fileToBase64(pdfFile);
            } catch (error) {
                alert('Error al procesar el archivo PDF');
                return;
            }
        } else if (pdfInput) {
            pdfSrc = pdfInput.startsWith('assets/') ? pdfInput : 'assets/' + pdfInput;
        }

        currentWeekData[weekKey].works.push({
            title: title,
            description: description || 'Sin descripcion',
            fecha: date || 'Fecha pendiente',
            pdfSrc: pdfSrc
        });

        saveData();
        rebuildUI();
        loadWorksList(weekKey);
        loadEditWeekSelect();

        addWorkModal.classList.remove('active');
        adminPanelModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        currentWizardWeekKey = null;
    });

    function loadEditWeekSelect() {
        var select = document.getElementById('edit-week-select');
        select.innerHTML = '';

        var weekKeys = Object.keys(currentWeekData).sort(function(a, b) {
            return currentWeekData[a].weekNumber - currentWeekData[b].weekNumber;
        });

        if (weekKeys.length === 0) {
            select.innerHTML = '<option value="">No hay semanas</option>';
            return;
        }

        weekKeys.forEach(function(weekKey) {
            var weekNum = currentWeekData[weekKey].weekNumber;
            var option = document.createElement('option');
            option.value = weekKey;
            option.textContent = 'Semana ' + weekNum;
            select.appendChild(option);
        });

        loadEditWorksList(select.value);
    }

    document.getElementById('edit-week-select').addEventListener('change', function() {
        loadEditWorksList(this.value);
    });

    function loadEditWorksList(weekKey) {
        var editWorksList = document.getElementById('edit-works-list');
        if (!editWorksList) return;

        editWorksList.innerHTML = '';

        if (!currentWeekData[weekKey]) return;

        var data = currentWeekData[weekKey];

        if (data.works.length === 0) {
            editWorksList.innerHTML = '<div class="empty-state">No hay trabajos en esta semana</div>';
            return;
        }

        data.works.forEach(function(work, index) {
            var item = document.createElement('div');
            item.className = 'admin-list-item';
            item.innerHTML = '<div class="admin-list-item-info">' +
                '<h4>' + work.title + (index > 0 ? ' (Trabajo ' + (index + 1) + ')' : '') + '</h4>' +
                '<p>' + work.fecha + '</p>' +
                '</div>' +
                '<div class="admin-list-item-actions">' +
                '<button class="btn-icon edit" data-week="' + weekKey + '" data-index="' + index + '" title="Editar">✎</button>' +
                '</div>';
            editWorksList.appendChild(item);
        });

        editWorksList.querySelectorAll('.btn-icon.edit').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var weekKey = this.getAttribute('data-week');
                var workIndex = parseInt(this.getAttribute('data-index'));
                openEditWorkModal(weekKey, workIndex);
            });
        });
    }

    function openEditWorkModal(weekKey, workIndex) {
        editingWorkIndex = workIndex;
        var work = currentWeekData[weekKey].works[workIndex];

        document.getElementById('edit-week-select').value = weekKey;
        loadEditWorksList(weekKey);

        document.getElementById('edit-title').value = work.title;
        document.getElementById('edit-description').value = work.description;
        document.getElementById('edit-date').value = work.fecha;

        var pdfPath = work.pdfSrc.startsWith('data:') ? '' : work.pdfSrc.replace('assets/', '');
        document.getElementById('edit-pdf').value = pdfPath;

        var preview = document.getElementById('edit-file-preview');
        if (work.pdfSrc && work.pdfSrc.startsWith('data:')) {
            preview.textContent = 'PDF cargado y guardado localmente';
            preview.classList.add('has-file');
        } else if (work.pdfSrc) {
            preview.textContent = 'Archivo actual: ' + work.pdfSrc;
            preview.classList.add('has-file');
        } else {
            preview.textContent = '';
            preview.classList.remove('has-file');
        }

        document.getElementById('edit-pdf-file').value = '';

        var editModal = document.getElementById('edit-work-modal');
        if (editModal) {
            editModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    document.getElementById('edit-pdf-file').addEventListener('change', function(e) {
        var file = e.target.files[0];
        var preview = document.getElementById('edit-file-preview');

        if (file) {
            if (file.type !== 'application/pdf') {
                alert('Por favor selecciona un archivo PDF');
                this.value = '';
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                alert('El archivo es demasiado grande. Maximo 10MB');
                this.value = '';
                return;
            }

            preview.textContent = 'Nuevo: ' + file.name + ' (' + (file.size / 1024).toFixed(2) + ' KB) - Se guardara al presionar "Guardar"';
            preview.classList.add('has-file');
        }
    });

    var saveEditWorkBtn = document.getElementById('save-edit-work-btn');
    if (saveEditWorkBtn) {
        saveEditWorkBtn.addEventListener('click', async function() {
            var weekKey = document.getElementById('edit-week-select').value;
            if (!weekKey || !currentWeekData[weekKey]) {
                alert('Selecciona una semana valida');
                return;
            }

            var title = document.getElementById('edit-title').value;
            var description = document.getElementById('edit-description').value;
            var date = document.getElementById('edit-date').value;
            var pdfInput = document.getElementById('edit-pdf').value;
            var pdfFile = document.getElementById('edit-pdf-file').files[0];

            if (!title) {
                alert('El titulo no puede estar vacio');
                return;
            }

            var pdfSrc = currentWeekData[weekKey].works[editingWorkIndex].pdfSrc || '';

            if (pdfFile) {
                try {
                    pdfSrc = await fileToBase64(pdfFile);
                } catch (error) {
                    alert('Error al procesar el archivo PDF');
                    return;
                }
            } else if (pdfInput) {
                pdfSrc = pdfInput.startsWith('assets/') ? pdfInput : 'assets/' + pdfInput;
            }

            currentWeekData[weekKey].works[editingWorkIndex].title = title;
            currentWeekData[weekKey].works[editingWorkIndex].description = description;
            currentWeekData[weekKey].works[editingWorkIndex].fecha = date;
            currentWeekData[weekKey].works[editingWorkIndex].pdfSrc = pdfSrc;

            saveData();
            rebuildUI();
            loadWorksList(weekKey);
            loadEditWorksList(weekKey);

            document.getElementById('edit-work-modal').classList.remove('active');
            document.body.style.overflow = 'auto';

            alert('Cambios guardados correctamente');
        });
    }

    var editWorkModal = document.getElementById('edit-work-modal');
    if (editWorkModal) {
        editWorkModal.querySelector('.modal-close').addEventListener('click', function() {
            editWorkModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });

        editWorkModal.addEventListener('click', function(e) {
            if (e.target === editWorkModal) {
                editWorkModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }

    adminLoginModal.addEventListener('click', function(e) {
        if (e.target === adminLoginModal) {
            adminLoginModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    adminPanelModal.addEventListener('click', function(e) {
        if (e.target === adminPanelModal) {
            adminPanelModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    addWeekModal.addEventListener('click', function(e) {
        if (e.target === addWeekModal) {
            addWeekModal.classList.remove('active');
            adminPanelModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });

    addWorkModal.addEventListener('click', function(e) {
        if (e.target === addWorkModal) {
            addWorkModal.classList.remove('active');
            adminPanelModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            currentWizardWeekKey = null;
        }
    });

    document.getElementById('new-week-number').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') document.getElementById('save-week-btn').click();
    });

    function setViewportHeight() {
        var vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', vh + 'px');
    }
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', function() {
        setTimeout(setViewportHeight, 100);
    });
});
