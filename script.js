document.addEventListener('DOMContentLoaded', () => {
    console.log("=== بدء تشغيل نظام تفويض الأحداث المطور لمنصة FREEDIT ===");

    const navItems = document.querySelectorAll('#navMenu li[data-target]');
    const contentSections = document.querySelectorAll('.content-section');
    const tabs = document.querySelectorAll(".internal-tab-btn[data-view]");
    
    // جلب حاويات العرض الأساسية
    const contestMainView = document.getElementById("contest-main-view");
    const freeditContestModal = document.getElementById("freeditContestModal"); // المودال الجديد
    const profileSettingsForm = document.getElementById('profileSettingsForm');
    const profileSettingsMessage = document.getElementById('profileSettingsMessage');
    const profileNameInput = document.getElementById('profileName');
    const profileTitleInput = document.getElementById('profileTitle');
    const profileLocationInput = document.getElementById('profileLocation');
    const profileMemberSinceInput = document.getElementById('profileMemberSince');
    const profileBioInput = document.getElementById('profileBio');
    const profileImageInput = document.getElementById('profileImage');
    const profileImageFileInput = document.getElementById('profileImageFile');
    const profilePhotoPreview = document.getElementById('profilePhotoPreview');
    const btnResetProfile = document.getElementById('btnResetProfile');

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function setProfilePreview(profileData) {
        const mainName = document.querySelector('.main-name');
        if (mainName) {
            mainName.innerHTML = `${escapeHtml(profileData.profile_name || 'الاسم')}<span class="edit-icon"><i class="fas fa-pen"></i></span>`;
        }

        const userName = document.querySelector('.u-name');
        if (userName) userName.textContent = profileData.profile_name || 'الاسم';

        const userTitle = document.querySelector('.u-title');
        if (userTitle) userTitle.textContent = profileData.profile_title || 'مصمم جرافيك';

        const bioText = document.querySelector('.bio-text');
        if (bioText) bioText.textContent = profileData.profile_bio || 'أحب تصميم الشعارات والهويات البصرية والتصاميم الإعلانية.';

        const subInfo = document.querySelector('.sub-info');
        if (subInfo) {
            const details = [];
            if (profileData.profile_title) details.push(profileData.profile_title);
            if (profileData.profile_location) details.push(`📍 ${profileData.profile_location}`);
            if (profileData.profile_member_since) details.push(`📅 ${profileData.profile_member_since}`);
            subInfo.innerHTML = details.length ? details.join(' • ') : 'مصمم جرافيك';
        }

        const bannerPreview = document.getElementById('profileImagePreview');
        const headerAvatar = document.getElementById('headerProfileAvatar');
        const imageUrl = profileData.profile_image_url || '';

        if (bannerPreview && headerAvatar) {
            if (imageUrl) {
                bannerPreview.innerHTML = `<img src="${escapeHtml(imageUrl)}" alt="الصورة الشخصية">`;
                bannerPreview.classList.add('has-image');
                headerAvatar.style.backgroundImage = `url("${imageUrl}")`;
                headerAvatar.style.backgroundSize = 'cover';
                headerAvatar.style.backgroundPosition = 'center';
                headerAvatar.innerHTML = '';
            } else {
                bannerPreview.innerHTML = '<span>الصورة</span>';
                bannerPreview.classList.remove('has-image');
                headerAvatar.style.backgroundImage = 'none';
                headerAvatar.innerHTML = '<i class="fas fa-user"></i>';
            }
        }

        if (profilePhotoPreview) {
            if (imageUrl) {
                profilePhotoPreview.innerHTML = `<img src="${escapeHtml(imageUrl)}" alt="معاينة الصورة">`;
                profilePhotoPreview.classList.add('has-image');
            } else {
                profilePhotoPreview.innerHTML = '<span>سيظهر هنا المعاينة</span>';
                profilePhotoPreview.classList.remove('has-image');
            }
        }
    }

    function populateProfileForm(profileData) {
        if (profileNameInput) profileNameInput.value = profileData.profile_name || '';
        if (profileTitleInput) profileTitleInput.value = profileData.profile_title || '';
        if (profileLocationInput) profileLocationInput.value = profileData.profile_location || '';
        if (profileMemberSinceInput) profileMemberSinceInput.value = profileData.profile_member_since || '';
        if (profileBioInput) profileBioInput.value = profileData.profile_bio || '';
        if (profileImageInput) profileImageInput.value = profileData.profile_image_url || '';
    }

    function getProfileFormData() {
        return {
            profile_name: profileNameInput ? profileNameInput.value.trim() : '',
            profile_title: profileTitleInput ? profileTitleInput.value.trim() : '',
            profile_location: profileLocationInput ? profileLocationInput.value.trim() : '',
            profile_member_since: profileMemberSinceInput ? profileMemberSinceInput.value.trim() : '',
            profile_bio: profileBioInput ? profileBioInput.value.trim() : '',
            profile_image_url: profileImageInput ? profileImageInput.value.trim() : ''
        };
    }

    async function uploadProfileImage(file) {
        const client = getSupabaseClient();
        if (!client || !file) return '';

        try {
            const fileExt = file.name.split('.').pop() || 'jpg';
            const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
            const filePath = `avatars/${safeName}`;
            const { error } = await client.storage.from('designer_files').upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

            if (error) throw error;

            const { data: publicUrlData } = client.storage.from('designer_files').getPublicUrl(filePath);
            return publicUrlData?.publicUrl || '';
        } catch (error) {
            console.error('فشل رفع الصورة الشخصية:', error);
            throw error;
        }
    }

    function setSettingsMessage(message, type = 'info') {
        if (!profileSettingsMessage) return;
        profileSettingsMessage.textContent = message;
        profileSettingsMessage.className = `settings-message ${type}`;
    }

    function getSupabaseClient() {
        return window.supabaseClient || window.supabaseClientInstance || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
    }

    function showSection(targetId) {
        navItems.forEach(nav => nav.classList.remove('active'));
        contentSections.forEach(section => section.classList.remove('active'));

        const targetSection = document.getElementById(targetId);
        const matchingNav = document.querySelector(`#navMenu li[data-target="${targetId}"]`);

        if (matchingNav) matchingNav.classList.add('active');

        if (targetSection) {
            targetSection.classList.add('active');
            if (targetId === 'freedit-section') {
                if (contestMainView) contestMainView.style.display = 'block';
                if (freeditContestModal) freeditContestModal.style.display = 'none';
            }
        }

        if (targetId === 'settings-section') {
            loadProfileData();
        }

        if (window.innerWidth <= 1024) {
            const sidebar = document.getElementById('sidebarRight');
            if (sidebar) sidebar.classList.remove('show');
        }
    }

    async function loadProfileData() {
        const savedProfile = JSON.parse(localStorage.getItem('designerProfile') || 'null');
        if (savedProfile) {
            populateProfileForm(savedProfile);
            setProfilePreview(savedProfile);
        }

        const client = getSupabaseClient();
        if (!client) return;

        try {
            const { data, error } = await client.from('profiles').select('*').eq('id', 'default-profile').maybeSingle();
            if (error) throw error;
            if (data) {
                populateProfileForm(data);
                setProfilePreview(data);
                localStorage.setItem('designerProfile', JSON.stringify(data));
            }
        } catch (error) {
            console.warn('تعذر تحميل الملف الشخصي من Supabase:', error);
            setSettingsMessage('تم حفظ البيانات محلياً. يرجى تشغيل SQL المدرج في Supabase لتمكين الجدول والسياسات.', 'info');
        }
    }

    async function saveProfileData(event) {
        if (event) event.preventDefault();

        let profileData = getProfileFormData();
        const selectedImageFile = profileImageFileInput?.files?.[0];

        if (selectedImageFile) {
            setSettingsMessage('جارٍ رفع الصورة الشخصية...', 'info');
            try {
                const uploadedImageUrl = await uploadProfileImage(selectedImageFile);
                if (uploadedImageUrl) {
                    profileData = { ...profileData, profile_image_url: uploadedImageUrl };
                    if (profileImageInput) profileImageInput.value = uploadedImageUrl;
                }
            } catch (error) {
                setSettingsMessage('لم يتم رفع الصورة الشخصية، لكن البيانات الأخرى سيتم حفظها محلياً.', 'info');
            }
        }

        localStorage.setItem('designerProfile', JSON.stringify(profileData));
        setProfilePreview(profileData);
        setSettingsMessage('تم حفظ الملف الشخصي محلياً بنجاح. جارٍ محاولة حفظه في قاعدة البيانات...', 'info');

        const client = getSupabaseClient();
        if (!client) {
            setSettingsMessage('تم حفظ البيانات محلياً لأن اتصال Supabase غير متاح حالياً.', 'info');
            return;
        }

        try {
            const { data, error } = await client
                .from('profiles')
                .upsert([{ id: 'default-profile', ...profileData, updated_at: new Date().toISOString() }], { onConflict: 'id' })
                .select();

            if (error) throw error;

            if (data && data[0]) {
                setSettingsMessage('تم حفظ الملف الشخصي والصورة بنجاح في قاعدة البيانات.', 'success');
            }
        } catch (error) {
            console.error('فشل حفظ الملف الشخصي في Supabase:', error);
            setSettingsMessage('تم حفظ البيانات محلياً؛ يرجى تشغيل الاستعلام SQL المتوفر في ملف supabase-profile-table.sql داخل Supabase.', 'info');
        }
    }

    // 1. التنقل عبر القائمة الجانبية
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            showSection(targetId);
        });
    });

    document.getElementById('btnViewPublicProfile')?.addEventListener('click', () => showSection('settings-section'));
    document.getElementById('btnEditProfile')?.addEventListener('click', () => showSection('settings-section'));

    if (profileSettingsForm) {
        profileSettingsForm.addEventListener('submit', saveProfileData);
    }

    if (btnResetProfile) {
        btnResetProfile.addEventListener('click', () => {
            populateProfileForm({
                profile_name: '',
                profile_title: '',
                profile_location: '',
                profile_member_since: '',
                profile_bio: '',
                profile_image_url: ''
            });
            setProfilePreview({
                profile_name: 'الاسم',
                profile_title: 'مصمم جرافيك',
                profile_location: '',
                profile_member_since: '',
                profile_bio: 'أحب تصميم الشعارات والهويات البصرية والتصاميم الإعلانية.',
                profile_image_url: ''
            });
            setSettingsMessage('تم إعادة تعيين النموذج. يمكنك إدخال بيانات جديدة ثم الحفظ.', 'info');
        });
    }

    loadProfileData();

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

        const client = window.supabaseClient || window.supabaseClientInstance || (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
        const fallbackDesigns = [
            { design_title: 'هوية فاخرة', designer_name: 'عمار محمد علي', image_urls: ['https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80'] },
            { design_title: 'بوستر عناية', designer_name: 'سارة أحمد', image_urls: ['https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80'] }
        ];

        try {
            if (!client) throw new Error('المрубِط غير جاهز');

            const { data: submissions, error } = await client.from('submissions').select('*').order('created_at', { ascending: false }).limit(6);
            if (error) throw error;

            const designs = (submissions && submissions.length) ? submissions : fallbackDesigns;
            gridContainer.innerHTML = "";

            designs.forEach(design => {
                const coverImage = Array.isArray(design.image_urls) ? design.image_urls[0] : (design.image_urls || 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=800&q=80');
                const displayTitle = design.design_title || 'تصميم جديد';
                const displayAuthor = design.designer_name || 'مبدع';
                gridContainer.insertAdjacentHTML('beforeend', `
                    <div class="design-card-item">
                        <div class="design-card-thumbnail"><img src="${coverImage}" alt="${displayTitle}"></div>
                        <div class="design-card-body">
                            <h4 class="design-card-title">${displayTitle}</h4>
                            <p class="design-card-author">${displayAuthor}</p>
                            <div class="design-card-rating"><span class="rating-number">4.9</span><div class="rating-stars"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i></div></div>
                        </div>
                    </div>
                `);
            });

            if (typeof window.renderQuickStats === 'function') window.renderQuickStats(designs.length);
        } catch (err) {
            console.error("خطأ أثناء جلب التصاميم من Supabase:", err);
            gridContainer.innerHTML = `<div class="loading-designs">💡 تم تحميل تصاميم افتراضية بسبب عدم توفر البيانات.</div>`;
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
