// ==========================================
// تهيئة عميل Supabase وتجنب التعارض
// ==========================================
const SUPABASE_URL = "https://xzqoelwnuxlqynltybia.supabase.co"; // استبدل برابط مشروعك
const SUPABASE_ANON_KEY = "sb_publishable_0qNkrg-Ftb-Pqq_mKMEl9A_5ONSgk9K";                 // استبدل بمفتاح Anon الخاص بك

let supabaseClient = null;

if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error("فشل تحميل مكتبة Supabase CDN. يرجى التحقق من اتصال الإنترنت.");
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. تحديد عناصر الواجهة والنافذة
    const uploadModal = document.getElementById('uploadModal');
    const headerUploadBtn = document.querySelector('.header-upload-btn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const uploadForm = document.getElementById('uploadForm');

    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const selectedFileName = document.getElementById('selectedFileName');

    const modalFileName = document.getElementById('modalFileName');
    const modalFileFormat = document.getElementById('modalFileFormat');
    const modalFileType = document.getElementById('modalFileType');
    const modalAddDate = document.getElementById('modalAddDate');
    const modalProductName = document.getElementById('modalProductName');

    const progressContainer = document.getElementById('progressContainer');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressText = document.getElementById('progressText');
    const modalAlert = document.getElementById('modalAlert');
    const submitUploadBtn = document.getElementById('submitUploadBtn');
    // ==========================================
    // جلب وعرض بيانات المشاريع ديناميكياً من Supabase
    // ==========================================

    // مصفوفة عامة لتخزين المشاريع محلياً لسرعة التصفية
    let allProjectsData = [];
    let currentProjectFilter = 'all';

    // تعيين التاريخ الحالي افتراضياً لحقل تاريخ الإضافة
    if (modalAddDate) {
        const today = new Date().toISOString().split('T')[0];
        modalAddDate.value = today;
    }

    // ==========================================
    // 2. التحكم بفتح وإغلاق النافذة المنبثقة (Modal)
    // ==========================================
    function openModal() {
        if (!uploadModal) return;
        uploadModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // منع التمرير في الصفحة عند فتح النافذة
    }

    function closeModal() {
        if (!uploadModal) return;
        uploadModal.classList.remove('active');
        document.body.style.overflow = 'auto'; // إعادة التمرير
        resetForm();
    }

    // ربط أزرار فتح النافذة
    if (headerUploadBtn) {
        headerUploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }

    // ربط إغلاق النافذة
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

    // إغلاق عند النقر خارج صندوق النافذة
    window.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
            closeModal();
        }
    });

    // ==========================================
    // 3. التحكم بسحب وإسقاط وتصفح الملفات
    // ==========================================
    if (dropZone) {
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('dragover');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                fileInput.files = files;
                handleFileSelection(files[0]);
            }
        });

        dropZone.addEventListener('click', () => {
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileSelection(e.target.files[0]);
            }
        });
    }

    // استخراج معلومات الملف تلقائياً
    function handleFileSelection(file) {
        if (!file) return;

        selectedFileName.textContent = `الملف المحدد: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;

        // استخراج الامتداد تلقائياً
        const nameParts = file.name.split('.');
        const ext = nameParts.length > 1 ? nameParts.pop().toUpperCase() : '';
        const rawName = nameParts.join('.');

        if (!modalFileName.value) modalFileName.value = rawName;
        if (!modalFileFormat.value) modalFileFormat.value = ext;
    }

    // ==========================================
    // 4. معالجة الرفع والتخزين بالكامل
    // ==========================================
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // منع سلوك المتصفح الافتراضي في إعادة التحميل
            e.stopPropagation();

            showAlert('', 'none');

            const file = fileInput.files[0];
            if (!file) {
                showAlert('يرجى اختيار ملف لرفعه أولاً.', 'error');
                return;
            }

            if (!supabaseClient) {
                showAlert('خطأ: لم يتم الاتصال بـ Supabase. يرجى التأكد من المفاتيح.', 'error');
                return;
            }

            submitUploadBtn.disabled = true;
            submitUploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الرفع...';
            progressContainer.style.display = 'block';
            updateProgress(20);

            try {
                // أ) تجهيز اسم آمن للملف لمنع تعارض الحروف العربية
                const fileExt = file.name.split('.').pop();
                const sanitizedFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
                const filePath = `uploads/${sanitizedFileName}`;

                updateProgress(40);

                // ب) رفع الملف الفعلي إلى Supabase Storage Bucket
                const { data: storageData, error: storageError } = await supabaseClient
                    .storage
                    .from('designer_files')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (storageError) {
                    throw new Error(`خطأ في رفع الملف للحاوية: ${storageError.message}`);
                }

                updateProgress(70);

                // ج) الحصول على رابط الملف العام المباشر
                const { data: publicUrlData } = supabaseClient
                    .storage
                    .from('designer_files')
                    .getPublicUrl(filePath);

                const publicUrl = publicUrlData ? publicUrlData.publicUrl : '';

                // د) حفظ البيانات المطلوبة في جدول `files`
                const fileRecord = {
                    file_name: modalFileName.value.trim(),
                    file_format: modalFileFormat.value.trim().toUpperCase(),
                    file_type: modalFileType.value,
                    added_date: modalAddDate.value,
                    product_name: modalProductName.value.trim(),
                    file_url: publicUrl,
                    file_size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                };

                const { data: dbData, error: dbError } = await supabaseClient
                    .from('files')
                    .insert([fileRecord])
                    .select();

                if (dbError) {
                    throw new Error(`خطأ في حفظ البيانات بقاعدة البيانات: ${dbError.message}`);
                }

                updateProgress(100);
                showAlert('تم رفع الملف وحفظ كافة البيانات بنجاح!', 'success');

                // هـ) تحديث الجدول في واجهة المستخدم ديناميكياً
                appendFileToUI(fileRecord);

                setTimeout(() => {
                    closeModal();
                }, 1500);

            } catch (err) {
                console.error("Upload Error:", err);
                showAlert(err.message || 'حدث خطأ غير متوقع أثناء الرفع.', 'error');
            } finally {
                submitUploadBtn.disabled = false;
                submitUploadBtn.innerHTML = '<i class="fas fa-paper-plane"></i> حفظ ورفع الملف';
            }
        });
    }

    // ==========================================
    // 5. وظائف مساعدة للديناميكية والتنبيهات
    // ==========================================
    function updateProgress(percent) {
        progressBarFill.style.width = `${percent}%`;
        progressText.textContent = `${percent}%`;
    }

    function showAlert(msg, type) {
        if (!modalAlert) return;
        if (type === 'none') {
            modalAlert.style.display = 'none';
            return;
        }
        modalAlert.className = `modal-alert ${type}`;
        modalAlert.textContent = msg;
        modalAlert.style.display = 'block';
    }

    function resetForm() {
        if (uploadForm) uploadForm.reset();
        selectedFileName.textContent = 'لم يتم اختيار ملف بعد';
        progressContainer.style.display = 'none';
        updateProgress(0);
        showAlert('', 'none');
        if (modalAddDate) {
            modalAddDate.value = new Date().toISOString().split('T')[0];
        }
    }

    // إضافة الملف المرفوع مباشرة لجدول قائمة الملفات بالصفحة دون تحديث
    function appendFileToUI(fileData) {
        const filesContainer = document.querySelector('.files-list-container');
        if (!filesContainer) return;

        const newRow = document.createElement('div');
        newRow.className = 'list-row file-item';
        newRow.innerHTML = `
            <div class="col-format file-format-info">
                <div class="pdf-icon-box">${fileData.file_format}</div>
                <div class="file-name-info">
                    <strong>${fileData.file_name}</strong>
                    <span>${fileData.file_size || 'ملف جديد'}</span>
                </div>
            </div>
            <div class="col-type">${fileData.file_type}</div>
            <div class="col-date">${fileData.added_date}</div>
            <div class="col-product">${fileData.product_name}</div>
        `;

        // إدراج الصف الجديد مباشرة بعد صف العناوين Header
        const headerRow = filesContainer.querySelector('.header-row');
        if (headerRow && headerRow.nextSibling) {
            filesContainer.insertBefore(newRow, headerRow.nextSibling);
        } else {
            filesContainer.appendChild(newRow);
        }
    }

    
});

// دالة جلب كافة الملفات وحساب الإحصائيات
async function fetchAndRenderFiles() {
    const dynamicFilesList = document.getElementById('dynamicFilesList');
    if (!dynamicFilesList) return;

    // إظهار مؤشر التحميل
    dynamicFilesList.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-muted);">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
            <p style="margin-top: 10px;">جاري تحميل الملفات من Supabase...</p>
        </div>
    `;

    try {
        if (!supabaseClient) {
            throw new Error("لم يتم تهيئة Supabase بنجاح.");
        }

        // جلب جميع الصفوف من جدول files مرتبة من الأحدث إلى الأقدم
        const { data: files, error } = await supabaseClient
            .from('files')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 1. تحديث قائمة الملفات في الجدول
        renderFilesList(files);

        // 2. حساب وتحديث بطاقات الإحصائيات علوياً
        calculateAndRenderStats(files);

    } catch (err) {
        console.error("Error fetching files:", err);
        dynamicFilesList.innerHTML = `
            <div style="text-align: center; padding: 25px; color: #ff6b6b;">
                <i class="fas fa-exclamation-triangle fa-2x"></i>
                <p style="margin-top: 10px;">حدث خطأ أثناء جلب الملفات: ${err.message}</p>
            </div>
        `;
    }
}

// دالة بناء وتوليد صفوف الجدول ديناميكياً
function renderFilesList(files) {
    const dynamicFilesList = document.getElementById('dynamicFilesList');
    if (!dynamicFilesList) return;

    if (!files || files.length === 0) {
        dynamicFilesList.innerHTML = `
            <div style="text-align: center; padding: 35px; color: var(--text-muted);">
                <i class="fas fa-folder-open fa-2x" style="margin-bottom: 10px; color: var(--border-neon);"></i>
                <p>لا توجد ملفات مرفوعة حالياً. انقر على "رفع ملف جديد" لإضافة ملفك الأول.</p>
            </div>
        `;
        return;
    }

    let html = '';
    files.forEach(file => {
        const format = (file.file_format || 'FILE').toUpperCase();
        const fileName = file.file_name || 'بدون اسم';
        const fileType = file.file_type || 'غير محدد';
        const date = file.added_date || file.created_at?.split('T')[0] || '-';
        const product = file.product_name || '-';
        const fileUrl = file.file_url || '#';
        const fileSize = file.file_size || '';

        // تحديد أيقونة ولون حسب صيغة الملف
        let iconClass = 'fa-file';
        if (['PDF'].includes(format)) iconClass = 'fa-file-pdf';
        else if (['PNG', 'JPG', 'JPEG', 'WEBP', 'SVG'].includes(format)) iconClass = 'fa-file-image';
        else if (['ZIP', 'RAR', '7Z'].includes(format)) iconClass = 'fa-file-archive';
        else if (['PSD', 'AI', 'FIG'].includes(format)) iconClass = 'fa-file-code';

        html += `
            <div class="list-row file-item">
                <div class="col-format file-format-info">
                    <div class="pdf-icon-box" style="display: flex; align-items: center; gap: 6px;">
                        <i class="fas ${iconClass}"></i> ${format}
                    </div>
                    <div class="file-name-info">
                        <strong>
                            <a href="${fileUrl}" target="_blank" style="color: inherit; text-decoration: none;" title="تحميل/عرض الملف">
                                ${fileName} <i class="fas fa-external-link-alt" style="font-size: 0.75rem; color: var(--accent-gold); margin-right: 4px;"></i>
                            </a>
                        </strong>
                        <span>${fileSize ? fileSize + ' • ' : ''}ملف ${format}</span>
                    </div>
                </div>
                <div class="col-type"><span class="badge-type">${fileType}</span></div>
                <div class="col-date">${date}</div>
                <div class="col-product">${product}</div>
            </div>
        `;
    });

    dynamicFilesList.innerHTML = html;
}

// دالة حساب الإحصائيات ديناميكياً من مصفوفة الملفات
function calculateAndRenderStats(files) {
    const statTotalFiles = document.getElementById('statTotalFiles');
    const statTotalStorage = document.getElementById('statTotalStorage');
    const statTotalTypes = document.getElementById('statTotalTypes');
    const statThisMonthFiles = document.getElementById('statThisMonthFiles');

    if (!files) files = [];

    // 1. إجمالي عدد الملفات
    if (statTotalFiles) {
        statTotalFiles.textContent = `ملف ${files.length}`;
    }

    // 2. حساب إجمالي المساحة المستخدمة (باستخراج أرقام الـ MB/KB من file_size)
    let totalMB = 0;
    files.forEach(f => {
        if (f.file_size) {
            const match = f.file_size.match(/([\d\.]+)/);
            if (match) {
                const val = parseFloat(match[1]);
                if (f.file_size.toUpperCase().includes('KB')) totalMB += val / 1024;
                else if (f.file_size.toUpperCase().includes('GB')) totalMB += val * 1024;
                else totalMB += val; // افتراض MB
            }
        }
    });

    if (statTotalStorage) {
        if (totalMB >= 1024) {
            statTotalStorage.textContent = `${(totalMB / 1024).toFixed(2)} GB`;
        } else {
            statTotalStorage.textContent = `${totalMB.toFixed(2)} MB`;
        }
    }

    // 3. حساب عدد أنواع الملفات الفريدة
    const uniqueTypes = new Set(files.map(f => f.file_type).filter(Boolean));
    if (statTotalTypes) {
        statTotalTypes.textContent = uniqueTypes.size;
    }

    // 4. حساب الملفات المضافة خلال الشهر الحالي
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const thisMonthCount = files.filter(f => {
        const fileDate = new Date(f.added_date || f.created_at);
        return fileDate.getFullYear() === currentYear && fileDate.getMonth() === currentMonth;
    }).length;

    if (statThisMonthFiles) {
        statThisMonthFiles.textContent = `ملف ${thisMonthCount}+`;
    }
}
// دالة جلب المشاريع من قاعدة البيانات
async function fetchAndRenderProjects() {
    const projectsGrid = document.getElementById('dynamicProjectsGrid');
    if (!projectsGrid) return;

    try {
        if (!supabaseClient) throw new Error("لم يتم تهيئة Supabase بنجاح.");

        // جلب المشاريع مرتبة من الأحدث للأقدم
        const { data: projects, error } = await supabaseClient
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allProjectsData = projects || [];
        
        // عرض المشاريع حسب الفلتر الحالي
        renderProjectsGrid();

    } catch (err) {
        console.error("Error fetching projects:", err);
        projectsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: #ff6b6b;">
                <i class="fas fa-exclamation-triangle fa-2x"></i>
                <p style="margin-top: 10px;">حدث خطأ أثناء جلب المشاريع: ${err.message}</p>
            </div>
        `;
    }
}

// دالة رندر بطاقات المشاريع
function renderProjectsGrid() {
    const projectsGrid = document.getElementById('dynamicProjectsGrid');
    if (!projectsGrid) return;

    // تصفية البيانات حسب الفلتر المختار
    const filteredProjects = allProjectsData.filter(p => {
        if (currentProjectFilter === 'all') return true;
        return p.status === currentProjectFilter;
    });

    if (filteredProjects.length === 0) {
        projectsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fas fa-folder-open fa-2x" style="margin-bottom: 10px;"></i>
                <p>لا توجد مشاريع في هذا التصنيف حالياً.</p>
            </div>
        `;
        return;
    }

    let html = '';
    filteredProjects.forEach(project => {
        const title = project.title || 'مشروع بدون عنوان';
        const desc = project.description || '';
        const progress = project.progress ?? 0;
        const dueDate = project.due_date || 'غير محدد';
        const status = project.status || 'progress';

        // إعداد نصوص وألوان شارة الحالة وشريط التقدم
        let statusTagClass = 'status-progress';
        let statusText = 'قيد التنفيذ';
        let progressBgColor = '';

        if (status === 'pending') {
            statusTagClass = 'status-pending';
            statusText = 'بانتظار التأكيد';
            progressBgColor = 'background: #ff9800;';
        } else if (status === 'completed') {
            statusTagClass = 'status-completed';
            statusText = 'المكتملة';
            progressBgColor = 'background: #4caf50;';
        }

        // توليد صور/دوائر فريق العمل الديناميكية
        let avatarsHtml = '';
        let avatars = project.team_avatars;
        if (typeof avatars === 'string') {
            try { avatars = JSON.parse(avatars); } catch(e) { avatars = []; }
        }
        
        if (Array.isArray(avatars) && avatars.length > 0) {
            avatars.forEach(av => {
                const letter = av.letter || 'U';
                const bg = av.bg || '#8a2be2';
                avatarsHtml += `<span class="avatar-circle" style="background-color: ${bg};">${letter}</span>`;
            });
        } else {
            avatarsHtml = `<span class="avatar-circle" style="background-color: #6c757d;"><i class="fas fa-user" style="font-size: 0.7rem;"></i></span>`;
        }

        html += `
            <div class="project-card" data-status="${status}">
                <div class="card-p-header">
                    <span class="p-status-tag ${statusTagClass}">${statusText}</span>
                    <i class="fas fa-ellipsis-v card-actions-icon"></i>
                </div>
                <h3 class="p-card-title">${title}</h3>
                <p class="p-card-desc">${desc}</p>
                
                <div class="p-progress-container">
                    <div class="p-progress-text">
                        <span>نسبة الإنجاز</span>
                        <strong>${progress}%</strong>
                    </div>
                    <div class="p-progress-bar-bg">
                        <div class="p-progress-bar-fill" style="width: ${progress}%; ${progressBgColor}"></div>
                    </div>
                </div>

                <div class="card-p-footer">
                    <div class="p-team-avatars">
                        ${avatarsHtml}
                    </div>
                    <div class="p-due-date">
                        <i class="far fa-calendar-alt"></i> ${dueDate}
                    </div>
                </div>
            </div>
        `;
    });

    projectsGrid.innerHTML = html;
}

// ==========================================
// ربط أحداث أزرار التصفية والتبويبات
// ==========================================
function setupProjectsTabsLogic() {
    const tabButtons = document.querySelectorAll('.projects-tabs .tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            currentProjectFilter = this.getAttribute('data-filter') || 'all';
            renderProjectsGrid();
        });
    });
}
// ==========================================
// ربط الأحداث وتشغيل الجلب عند فتح الواجهة
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. جلب البيانات فور تحميل الصفحة
    fetchAndRenderFiles();

    // 2. زر تحديث القائمة يدوياً
    const refreshFilesBtn = document.getElementById('refreshFilesBtn');
    if (refreshFilesBtn) {
        refreshFilesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fetchAndRenderFiles();
        });
    }
    fetchAndRenderProjects();

    // 2. تفعيل منطق تبويبات التصفية
    setupProjectsTabsLogic();

    // 3. تحديث المشاريع عند النقر على تبويب "المشاريع" بالقائمة الجانبية
    const projectsNavTab = document.querySelector('#navMenu li[data-target="projects-section"]');
    if (projectsNavTab) {
        projectsNavTab.addEventListener('click', () => {
            fetchAndRenderProjects();
        });
    }

    // 3. تحديث القائمة عند النقر على تبويب "الملفات" في القائمة الجانبية
    const foldersNavTab = document.querySelector('#navMenu li[data-target="folders-section"]');
    if (foldersNavTab) {
        foldersNavTab.addEventListener('click', () => {
            fetchAndRenderFiles();
        });
    }
});

// متغيرات عامة لحفظ حالة البيانات المرفوعة أثناء الخطوات
let currentStep = 1;
let uploadedFilesArray = []; // لحفظ كائنات الملفات المرفوعة من الجهاز
let uploadedUrls = []; // روابط الملفات بعد رفعها لـ Supabase

document.addEventListener("click", async (e) => {
    
    // 1. التقاط فتح المودال عند الضغط على زر المشاركة
    const isSubmitBtn = e.target.closest('#btnStartParticipation') || 
                        e.target.closest('.btn-primary') || 
                        (e.target.tagName === 'BUTTON' && e.target.textContent.includes('المشاركة في المسابقة'));

    if (isSubmitBtn) {
        e.preventDefault();
        const modal = document.getElementById("freeditContestModal");
        if (modal) {
            modal.style.setProperty('display', 'flex', 'important');
            document.body.style.overflow = "hidden";
            // إعادة تصفير الخطوات عند الفتح الجديد
            resetWizardStatus();
        }
    }

    // 2. تفعيل زر إغلاق الـ Modal (X)
    if (e.target.closest('#btnCloseContestModal')) {
        const modal = document.getElementById("freeditContestModal");
        if (modal) {
            modal.style.setProperty('display', 'none', 'important');
            document.body.style.overflow = "auto";
        }
    }

    // ==========================================================================
    // 3. محرك التنقل الديناميكي عبر الخطوات الأربعة وحفظ البيانات في سوبابيس
    // ==========================================================================
    if (e.target.closest('#btnNextStep')) {
        e.preventDefault();
        const nextBtn = document.getElementById('btnNextStep');

        if (currentStep === 1) {
            // التحقق من إدخال الوصف قبل الانتقال
            const desc = document.getElementById('designDesc').value.trim();
            if(!desc) { alert("رجاءً اكتب وصفاً أو نبذة عن تصميمك أولاً."); return; }
            
            goToStep(2);
        } 
        else if (currentStep === 2) {
            // جمع معلومات الخطوة 2 وتجهيز المعاينة في الخطوة 3
            const title = document.getElementById('workTitle').value.trim();
            if(!title) { alert("رجاءً أدخل عنواناً لعملك الفني."); return; }
            
            document.getElementById('summaryTitle').textContent = title;
            document.getElementById('summaryDesc').textContent = document.getElementById('designDesc').value;
            
            // جمع الأدوات المختارة
            let selectedTools = [];
            document.querySelectorAll('input[name="tools"]:checked').forEach(cb => selectedTools.push(cb.value));
            document.getElementById('summaryTools').textContent = selectedTools.length > 0 ? selectedTools.join('، ') : 'لم يتم تحديد أدوات';
            document.getElementById('summaryFilesCount').textContent = uploadedFilesArray.length;

            // تحويل اسم الزر إلى "تأكيد وإرسال المشاركة" في خطوة المعاينة
            nextBtn.innerHTML = `تأكيد وإرسال المشاركة <i class="fas fa-check"></i>`;
            goToStep(3);
        } 
        else if (currentStep === 3) {
            // المرحلة الحاسمة: رفع الصور والمستندات وحفظ السجل في سوبابيس
            nextBtn.disabled = true;
            nextBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> جاري رفع أعمالك وحفظها...`;

            try {
                // أولاً: رفع الملفات لـ Supabase Storage إذا وُجدت
                uploadedUrls = [];
                for (let file of uploadedFilesArray) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                    const filePath = `submissions/${fileName}`;

                    // استدعاء عميل سوبابيس المتاح في صفحتك لرفع الملف
                    const { data, error } = await supabaseClient.storage
                        .from('contest-submissions')
                        .upload(filePath, file);

                    if (error) throw error;

                    // الحصول على الرابط العلني للملف المرفوع
                    const { data: publicData } = supabaseClient.storage
                        .from('contest-submissions')
                        .getPublicUrl(filePath);

                    uploadedUrls.push(publicData.publicUrl);
                }

                // ثانياً: كتابة البيانات النصية وروابط الصور داخل جدول المشاركات (submissions)
                let selectedTools = [];
                document.querySelectorAll('input[name="tools"]:checked').forEach(cb => selectedTools.push(cb.value));

                const { data: insertData, error: insertError } = await supabaseClient
                    .from('submissions')
                    .insert([{
                        design_title: document.getElementById('workTitle').value.trim(),
                        design_description: document.getElementById('designDesc').value.trim(),
                        tools_used: selectedTools,
                        image_urls: uploadedUrls, // حفظ المصفوفة كاملة في قاعدة البيانات
                        status: 'قيد المراجعة'
                    }]);

                if (insertError) throw insertError;

                // النجاح والانتقال للخطوة 4 والأخيرة
                goToStep(4);
                nextBtn.style.display = 'none'; // إخفاء زر التالي في شاشة النجاح
                const closeBtn = document.getElementById('btnCloseContestModal');
                if(closeBtn) closeBtn.style.display = 'block';

            } catch (err) {
                console.error("خطأ أثناء حفظ البيانات الفنية في Supabase:", err);
                alert("حدث خطأ أثناء الإرسال: " + err.message);
                nextBtn.disabled = false;
                nextBtn.innerHTML = `تأكيد وإرسال المشاركة <i class="fas fa-check"></i>`;
            }
        }
    }
});

// دالة برمجية للتحكم بالانتقال البصري بين الخطوات وتحديث شريط الأرقام العلوي
function goToStep(stepNumber) {
    currentStep = stepNumber;
    
    // إخفاء كافة محتويات الخطوات القديمة
    document.querySelectorAll('.wizard-step-content').forEach(el => el.classList.add('hidden'));
    // إظهار محتوى الخطوة المحددة
    document.getElementById(`step-content-${stepNumber}`).classList.remove('hidden');

    // تحديث الإضاءة البنفسجية في شريط الأرقام العلوي
    document.querySelectorAll('.step-progress').forEach(stepEl => {
        const elStep = parseInt(stepEl.getAttribute('data-step'));
        if(elStep <= stepNumber) {
            stepEl.classList.add('active');
        } else {
            stepEl.classList.remove('active');
        }
    });
}

// دالة لتصفية وإعادة تعيين الواجهة عند فتحها من جديد
function resetWizardStatus() {
    uploadedFilesArray = [];
    uploadedUrls = [];
    document.getElementById('designDesc').value = '';
    document.getElementById('workTitle').value = '';
    document.querySelectorAll('input[name="tools"]').forEach(cb => cb.checked = false);
    const nextBtn = document.getElementById('btnNextStep');
    if(nextBtn) {
        nextBtn.style.display = 'flex';
        nextBtn.disabled = false;
        nextBtn.innerHTML = `التالي <i class="fas fa-arrow-left"></i>`;
    }
    goToStep(1);
}

// مراقبة اختيار الملفات من الجهاز لتخزينها في المصفوفة
document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'fileInput') {
        const files = e.target.files;
        for (let i = 0; i < files.length; i++) {
            uploadedFilesArray.push(files[i]);
            console.log(`تم تجهيز ملف للرفع لاحقاً: ${files[i].name}`);
        }
        // تحديث الرقم الظاهري للملفات الجاهزة في الكونسول أو الواجهة
        alert(`تم اختيار وتجهيز عدد (${files.length}) ملفات للتصميم.`);
    }
});

// تصدير العميل إلى كائن النافذة العالمي ليتعرف عليه ملف script.js
window.supabaseClient = supabaseClient;
