/* =========================================
   1. НАСТРОЙКИ И БИБЛИОТЕКИ
   ========================================= */
   gsap.registerPlugin(ScrollTrigger);

   // 1. Плавный скролл
   const lenis = new Lenis({
       duration: 1.2,
       easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
       smooth: true,
   });

   function raf(time) {
       lenis.raf(time);
       requestAnimationFrame(raf);
   }
   requestAnimationFrame(raf);

   // 2. Хедер
   const header = document.querySelector('.header');
   window.addEventListener('scroll', () => {
       header.classList.toggle('scrolled', window.scrollY > 50);
   });

   /* =========================================
      2. THREE.JS ФОН
      ========================================= */
   function initThreeHero() {
       const container = document.getElementById('canvas-container');
       if (!container || typeof THREE === 'undefined') return;

       const scene = new THREE.Scene();
       scene.fog = new THREE.FogExp2(0x111827, 0.002);

       const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
       camera.position.z = 50;
       camera.position.y = 10;

       const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
       renderer.setSize(window.innerWidth, window.innerHeight);
       renderer.setPixelRatio(window.devicePixelRatio);
       container.appendChild(renderer.domElement);

       const geometry = new THREE.PlaneGeometry(100, 100, 40, 40);
       const material = new THREE.MeshBasicMaterial({
           color: 0xCCFF00,
           wireframe: true,
           transparent: true,
           opacity: 0.3
       });

       const plane = new THREE.Mesh(geometry, material);
       plane.rotation.x = -Math.PI / 2;
       scene.add(plane);

       const count = geometry.attributes.position.count;
       const initialPositions = new Float32Array(count * 3);
       for (let i = 0; i < count; i++) {
           initialPositions[i * 3] = geometry.attributes.position.getX(i);
           initialPositions[i * 3 + 1] = geometry.attributes.position.getY(i);
           initialPositions[i * 3 + 2] = geometry.attributes.position.getZ(i);
       }

       let time = 0;
       function animate() {
           requestAnimationFrame(animate);
           time += 0.01;
           const positions = geometry.attributes.position;
           for (let i = 0; i < count; i++) {
               const x = initialPositions[i * 3];
               const z = Math.sin(x / 5 + time) * 3 + Math.cos(x / 3 + time) * 2;
               positions.setZ(i, z);
           }
           geometry.attributes.position.needsUpdate = true;
           plane.rotation.z += 0.001;
           renderer.render(scene, camera);
       }
       animate();

       window.addEventListener('resize', () => {
           camera.aspect = window.innerWidth / window.innerHeight;
           camera.updateProjectionMatrix();
           renderer.setSize(window.innerWidth, window.innerHeight);
       });
   }

   /* =========================================
      3. МОБИЛЬНОЕ МЕНЮ И COOKIES
      ========================================= */
   const burger = document.querySelector('.header__burger');
   const mobileMenu = document.querySelector('.mobile-menu');
   const mobileLinks = document.querySelectorAll('.mobile-menu__link');

   function toggleMenu() {
       const isActive = burger.classList.toggle('active');
       mobileMenu.classList.toggle('active');

       if (isActive) {
           document.body.style.overflow = 'hidden';
           gsap.to(mobileLinks, { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, delay: 0.2 });
       } else {
           document.body.style.overflow = '';
           gsap.to(mobileLinks, { y: 20, opacity: 0, duration: 0.3 });
       }
   }

   if(burger) {
       burger.addEventListener('click', toggleMenu);
       mobileLinks.forEach(link => {
           link.addEventListener('click', () => {
               if (burger.classList.contains('active')) toggleMenu();
           });
       });
   }

   // Cookies
   const cookiePopup = document.getElementById('cookiePopup');
   if (cookiePopup && !localStorage.getItem('cookiesAccepted')) {
       setTimeout(() => cookiePopup.classList.add('show'), 2000);
       document.getElementById('acceptCookies').addEventListener('click', () => {
           localStorage.setItem('cookiesAccepted', 'true');
           cookiePopup.classList.remove('show');
       });
   }

   /* =========================================
      4. ВАЛИДАЦИЯ ФОРМЫ (С ЧЕКБОКСОМ)
      ========================================= */
   const form = document.getElementById('contactForm');
   if(form) {
       const captchaInput = document.getElementById('captcha');
       const captchaLabel = document.getElementById('captchaLabel');
       let captchaResult = 0;

       const initCaptcha = () => {
           const n1 = Math.floor(Math.random() * 10) + 1;
           const n2 = Math.floor(Math.random() * 10) + 1;
           captchaResult = n1 + n2;
           captchaLabel.textContent = `Сколько будет ${n1} + ${n2}?`;
       };
       initCaptcha();

       form.addEventListener('submit', (e) => {
           e.preventDefault();
           let isValid = true;

           // Функция подсветки ошибки
           const setError = (id, condition) => {
               const el = document.getElementById(id);
               const group = el.closest('.form-group');
               if (group) group.classList.toggle('error', condition);
               if(condition) isValid = false;
           };

           // 1. Имя
           setError('name', document.getElementById('name').value.trim().length < 2);

           // 2. Email
           setError('email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(document.getElementById('email').value));

           // 3. Телефон
           setError('phone', !/^[0-9+ ]{7,15}$/.test(document.getElementById('phone').value));

           // 4. Капча
           setError('captcha', parseInt(captchaInput.value) !== captchaResult);

           // 5. ЧЕКБОКС (Новая проверка)
           const policyCheckbox = document.getElementById('policy');
           const policyGroup = policyCheckbox.closest('.form-checkbox');

           if (!policyCheckbox.checked) {
               policyGroup.classList.add('error'); // Красим в красный
               isValid = false;
           } else {
               policyGroup.classList.remove('error');
           }

           // Если всё верно
           if(isValid) {
               const btn = form.querySelector('button');
               const oldText = btn.innerText;
               btn.innerText = 'Отправка...';
               btn.disabled = true; // Блокируем кнопку от повторных кликов

               setTimeout(() => {
                   document.getElementById('formSuccess').classList.add('active');
                   btn.innerText = oldText;
                   btn.disabled = false;
                   form.reset();
                   initCaptcha();
                   // Сбрасываем стили ошибок, если они остались
                   policyGroup.classList.remove('error');
               }, 1500);
           }
       });
   }

   /* =========================================
      5. АНИМАЦИИ
      ========================================= */
   document.addEventListener('DOMContentLoaded', () => {
       initThreeHero();

       const heroTl = gsap.timeline();
       heroTl.from(".hero__title", { y: 50, opacity: 0, duration: 1, ease: "power3.out", delay: 0.5 })
             .from(".hero__subtitle", { y: 30, opacity: 0, duration: 1, ease: "power3.out" }, "-=0.8")
             .from(".hero__actions-row", { y: 20, opacity: 0, duration: 1, ease: "power3.out" }, "-=0.8");

       // Методология (по одной карточке)
       const methodCards = document.querySelectorAll('.methodology .card');
       methodCards.forEach((card, index) => {
           gsap.fromTo(card,
               { y: 50, opacity: 0 },
               {
                   y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: index * 0.1,
                   scrollTrigger: { trigger: card, start: "top 90%", toggleActions: "play none none reverse" }
               }
           );
       });

       // Инновации
       gsap.from('.innovations__text', {
           scrollTrigger: { trigger: '.innovations', start: 'top 75%' },
           x: -50, opacity: 0, duration: 1
       });

       gsap.from('.glass-card', {
           scrollTrigger: { trigger: '.innovations', start: 'top 75%', scrub: 1 },
           rotate: 10, y: 100, ease: "none"
       });

       // Блог (по одной карточке)
       const blogCards = document.querySelectorAll('.blog-card');
       blogCards.forEach((card, index) => {
           gsap.fromTo(card,
               { y: 40, opacity: 0 },
               {
                   y: 0, opacity: 1, duration: 0.8, ease: "power2.out", delay: index * 0.1,
                   scrollTrigger: { trigger: card, start: "top 85%" }
               }
           );
       });

       setTimeout(() => ScrollTrigger.refresh(), 500);
   });