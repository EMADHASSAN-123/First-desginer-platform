document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // منطق التنقل (SPA Routing Logic)
    // ==========================================
    const navItems = document.querySelectorAll('#navMenu li[data-target]');
    const contentSections = document.querySelectorAll('.content-section');

    // 1. التنقل عبر القائمة الجانبية
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // إزالة كلاس active من جميع الروابط
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // إضافة كلاس active للرابط الذي تم النقر عليه
            this.classList.add('active');

            // إخفاء جميع الواجهات
            contentSections.forEach(section => {
                section.classList.remove('active');
            });

            // جلب معرف الواجهة الهدف وإظهارها
            const targetId = this.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            
            if(targetSection) {
                targetSection.classList.add('active');
            }

            // إغلاق القائمة الجانبية في شاشات الهاتف بعد اختيار واجهة
            if (window.innerWidth <= 1024) {
                document.getElementById('sidebarRight').classList.remove('show');
            }
        });
    });

    // 2. تفعيل زر "رفع ملف جديد" في الشريط العلوي
    const headerUploadBtn = document.querySelector('.header-upload-btn');
    if(headerUploadBtn) {
        headerUploadBtn.addEventListener('click', () => {
            // إزالة التفعيل من القائمة الجانبية (لأننا انتقلنا لواجهة غير موجودة فيها)
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // إخفاء جميع الواجهات
            contentSections.forEach(section => {
                section.classList.remove('active');
            });

            // إظهار واجهة الرفع فقط
            const uploadSection = document.getElementById('upload-section');
            if(uploadSection) {
                uploadSection.classList.add('active');
            }
        });
    }

    // ==========================================
    // بقية الأكواد (السحب والإفلات وقائمة البرجر)
    // ==========================================
    const burgerBtn = document.getElementById('burgerBtn');
    const sidebarRight = document.getElementById('sidebarRight');

    if(burgerBtn && sidebarRight) {
        burgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebarRight.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024) {
                if (!sidebarRight.contains(e.target) && e.target !== burgerBtn) {
                    sidebarRight.classList.remove('show');
                }
            }
        });
    }

    // ==========================================
    // تصفية المشاريع (Projects Filter Logic)
    // ==========================================
    const tabButtons = document.querySelectorAll('.tab-btn');
    const projectCards = document.querySelectorAll('.project-card');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // تفعيل الزر النشط
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const filterValue = this.getAttribute('data-filter');

            // تصفية الكروت
            projectCards.forEach(card => {
                const cardStatus = card.getAttribute('data-status');
                
                if (filterValue === 'all' || cardStatus === filterValue) {
                    card.style.display = 'flex'; // إظهار الكرت
                } else {
                    card.style.display = 'none';  // إخفاء الكرت
                }
            });
        });
    });
});