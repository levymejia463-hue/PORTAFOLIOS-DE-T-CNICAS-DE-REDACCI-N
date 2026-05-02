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

    var STORAGE_KEY = 'portafolio_data';

    var currentWeekData = loadData();

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
                    pdfSrc: 'https://drive.google.com/file/d/1ctqkAQzJ0gCE79GePxOpV3kEIJczIidM/view?usp=drive_link'
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
