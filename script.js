document.addEventListener('DOMContentLoaded', () => {
    console.log("=== بدء تشغيل نظام تفويض الأحداث المطور لمنصة FREEDIT ===");

    const navItems = document.querySelectorAll('#navMenu li[data-target]');
    const contentSections = document.querySelectorAll('.content-section');
    const tabs = document.querySelectorAll(".internal-tab-btn[data-view]");
    
    // جلب حاويات العرض الأساسية
    const contestMainView = document.getElementById("contest-main-view");
    const freeditContestModal = document.getElementById("freeditContestModal"); // المودال الجديد

    // 1. التنقل عبر القائمة الجانبية
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            contentSections.forEach(section => {
                section.classList.remove('active');
            });

            const targetId = this.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            
            if(targetSection) {
                targetSection.classList.add('active');
                if(targetId === 'freedit-section') {
                    if(contestMainView) contestMainView.style.display = 'block';
                    if(freeditContestModal) freeditContestModal.style.display = 'none';
                }
            }

            if (window.innerWidth <= 1024) {
                const sidebar = document.getElementById('sidebarRight');
                if(sidebar) sidebar.classList.remove('show');
            }
        });
    });

    // 2. تفعيل زر "رفع ملف جديد" في الشريط العلوي
    const headerUploadBtn = document.querySelector('.header-upload-btn');
    if(headerUploadBtn) {
        headerUploadBtn.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            contentSections.forEach(section => {
                section.classList.remove('active');
            });

            const uploadSection = document.getElementById('upload-section');
            if(uploadSection) {
                uploadSection.classList.add('active');
            }
        });
    }

    // القائمة الجانبية (البرجر)
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

    // 3. التحكم بالتبويبات الداخلية
    // 3. التحكم بالتبويبات الداخلية للمسابقة وجلب تصاميم Supabase الحية
        // 3. التحكم بالتبويبات الداخلية للمسابقة وجلب تصاميم سوبابيس الحية
    tabs.forEach(tab => {
        tab.addEventListener("click", async () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            
            const targetView = tab.getAttribute("data-view");
            console.log(`[تبويب داخلي]: تم الانتقال إلى تفاصيل عرض: ${targetView}`);

            // جلب حاويات العرض الأساسية لتبديلها بصرياً
            const detailsViewElement = document.getElementById("contest-main-view");
            const bottomSectionsElement = document.querySelector(".bottom-sections");
            const designsViewElement = document.getElementById("contest-designs-view");

            if (targetView === "designs") {
                // 1. التبديل البصري للواجهات
                if (detailsViewElement) {
                    const mainCard = detailsViewElement.querySelector(".competition-main-card");
                    if (mainCard) mainCard.style.display = "none";
                }
                if (bottomSectionsElement) bottomSectionsElement.style.display = "none";
                if (designsViewElement) designsViewElement.style.display = "block";

                // 2. استدعاء دالة جلب التصاميم الحية
                fetchAndRenderSubmittedDesigns();
            } 
            else if (targetView === "details") {
                // العودة للواجهة الافتراضية للتفاصيل
                if (detailsViewElement) {
                    const mainCard = detailsViewElement.querySelector(".competition-main-card");
                    if (mainCard) mainCard.style.display = "flex";
                }
                if (bottomSectionsElement) bottomSectionsElement.style.display = "flex";
                if (designsViewElement) designsViewElement.style.display = "none";
            }
        });
    });

    // دالة جلب البيانات من جدول مشاركات المبدعين وعرضها بشكل كروت خماسية
    async function fetchAndRenderSubmittedDesigns() {
        const gridContainer = document.getElementById("liveDesignsGrid");
        if (!gridContainer) return;

        // التقاط النسخة النشطة من عميل سوبابيس المعرف في ملفك الآخر
        const client = window.supabaseClient || window.supabaseClientInstance || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);

        try {
            if (!client) {
                console.error("❌ لم يتم العثور على العميل النشط 'supabaseClient'. تأكد من وضع window.supabaseClient = supabaseClient في نهاية ملف supabaseClient.js");
                gridContainer.innerHTML = `<div class="loading-designs">❌ خطأ: لم يتم تهيئة اتصال سوبابيس بشكل صحيح.</div>`;
                return;
            }

            // استعلام جلب البيانات حية باستخدام المتغير الخاص بك
            const { data: submissions, error } = await client
                .from('submissions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!submissions || submissions.length === 0) {
                gridContainer.innerHTML = `<div class="loading-designs">💡 لا توجد تصاميم مرفوعة في هذه المسابقة بعد. كن أول المشاركين!</div>`;
                return;
            }

            // تنظيف الحاوية ومسح مؤشر جاري التحميل لبناء الكروت
            gridContainer.innerHTML = "";

            submissions.forEach(design => {
                // التحقق من وجود صورة مرفوعة، وإذا لم توجد نضع صورة افتراضية أنيقة
                const coverImage = (design.image_urls && design.image_urls.length > 0) ? design.image_urls[0] : "https://unsplash.com";
                const displayTitle = design.design_title || "تصميم هوية فاخرة";
                const displayAuthor = design.designer_name || "عمار محمد علي";

                // بناء الكرت المطابق تماماً للصورة المرفوعة هيكلياً
                const cardHTML = `
                    <div class="design-card-item">
                        <div class="design-card-thumbnail">
                            <img src="${coverImage}" alt="${displayTitle}">
                            <button class="design-card-heart-btn" onclick="this.classList.toggle('liked')">
                                <i class="far fa-heart"></i>
                            </button>
                        </div>
                        <div class="design-card-body">
                            <h4 class="design-card-title">${displayTitle}</h4>
                            <p class="design-card-author">${displayAuthor}</p>
                            <div class="design-card-rating">
                                <span class="rating-number">4.9</span>
                                <div class="rating-stars">
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star-half-alt"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                gridContainer.insertAdjacentHTML("beforeend", cardHTML);
            });

        } catch (err) {
            console.error("خطأ أثناء جلب التصاميم من Supabase:", err);
            gridContainer.innerHTML = `<div class="loading-designs">❌ فشل تحميل البيانات: ${err.message}</div>`;
        }
    }


    // ==========================================================================
    // 4. الحل الجذري (تفويض الأحداث): مراقبة النقر على زر المشاركة أينما ومتى ما وُجد
    // ==========================================================================
    document.addEventListener("click", (e) => {
        // البحث عن الزر سواء بالـ ID أو من خلال محتواه النصي والكلاس لضمان التقاطه
        const isSubmitBtn = e.target.closest('#btnStartParticipation') || 
                            e.target.closest('.btn-primary') || 
                            (e.target.tagName === 'BUTTON' && e.target.textContent.includes('المشاركة في المسابقة'));

        if (isSubmitBtn) {
            e.preventDefault();
            console.log("🚨 [تفويض الأحداث]: تم التقاط النقر على زر المشاركة بنجاح، حتى لو كان مبنياً بواسطة Supabase!");
            
            const modal = document.getElementById("freeditContestModal");
            if (modal) {
                modal.style.setProperty('display', 'flex', 'important');
                document.body.style.overflow = "hidden"; // منع تمرير الصفحة الخلفية
                console.log("✅ [Modal]: تم إظهار واجهة الرفع بنجاح فوق كل العناصر.");
            } else {
                console.error("❌ خطأ: لم يتم العثور على عنصر يحمل id='freeditContestModal' في الـ HTML.");
            }
        }

        // 5. مراقبة زر إغلاق الـ Modal (X)
        if (e.target.closest('#btnCloseContestModal')) {
            const modal = document.getElementById("freeditContestModal");
            if (modal) {
                modal.style.setProperty('display', 'none', 'important');
                document.body.style.overflow = "auto";
                console.log("🔄 تم إغلاق نافذة الرفع بنجاح.");
            }
        }

        // إغلاق المودال عند النقر في المساحة الفارغة المحيطة به
        const modalOverlay = document.getElementById("freeditContestModal");
        if (e.target === modalOverlay) {
            modalOverlay.style.setProperty('display', 'none', 'important');
            document.body.style.overflow = "auto";
        }
    });

    // 6. تأثيرات منطقة السحب والإفلات (تم تعديلها لتراقب الـ Body بالكامل لضمان التقاط العنصر)
    document.addEventListener('dragover', (e) => {
        const zone = document.getElementById("contestDragDropZone") || document.getElementById("dragDropZone");
        if (zone && zone.contains(e.target)) {
            e.preventDefault();
            zone.style.borderColor = "#8e24aa";
            zone.style.backgroundColor = "#1e1535";
        }
    });

    document.addEventListener('dragleave', (e) => {
        const zone = document.getElementById("contestDragDropZone") || document.getElementById("dragDropZone");
        if (zone && !zone.contains(e.target)) {
            zone.style.borderColor = "#4a3070";
            zone.style.backgroundColor = "#151025";
        }
    });

    // 7. تصفية المشاريع السفلية
    const tabButtons = document.querySelectorAll('.tab-btn');
    const projectCards = document.querySelectorAll('.project-card');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const filterValue = this.getAttribute('data-filter');

            projectCards.forEach(card => {
                const cardStatus = card.getAttribute('data-status');
                if (filterValue === 'all' || cardStatus === filterValue) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // ==========================================================================
    // 8. نظام البحث السريع داخل كروت التصاميم المحملة
    // ==========================================================================
    const searchInput = document.getElementById('searchDesignsInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const filterText = this.value.toLowerCase().trim();
            const allDesignCards = document.querySelectorAll('.design-card-item');

            allDesignCards.forEach(card => {
                const titleElement = card.querySelector('.design-card-title');
                const authorElement = card.querySelector('.design-card-author');
                
                // جلب النصوص للبحث بداخلها
                const title = titleElement ? titleElement.textContent.toLowerCase() : "";
                const author = authorElement ? authorElement.textContent.toLowerCase() : "";

                // إظهار أو إخفاء الكرت بناءً على التطابق
                if (title.includes(filterText) || author.includes(filterText)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
});
