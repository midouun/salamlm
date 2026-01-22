// التحقق من دعم المتصفح لخاصية التعرف على الصوت
if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert("عذراً، متصفحك لا يدعم خاصية تحويل الصوت إلى نص. يرجى استخدام Google Chrome.");
} else {
    // إعداد متغيرات التعرف على الصوت
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // إعدادات اللغة والخصائص
    recognition.lang = 'ar-SA'; // اللغة العربية (السعودية) - يمكن تغييرها لـ ar-EG وغيرها
    recognition.continuous = true; // الاستمرار في الاستماع وعدم التوقف عند السكتة
    recognition.interimResults = true; // إظهار النتائج أثناء التحدث

    // عناصر واجهة المستخدم
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const clearBtn = document.getElementById('clear-btn');
    const statusText = document.getElementById('status');
    const finalTextArea = document.getElementById('final-text');
    const downloadBtn = document.getElementById('download-btn');
    const pdfNameInput = document.getElementById('pdf-name');

    let finalTranscript = ''; // تخزين النص النهائي

    // --- وظائف التعرف على الصوت ---

    // عند بدء التسجيل
    recognition.onstart = () => {
        statusText.textContent = "جاري الاستماع... يرجى التحدث الآن";
        startBtn.disabled = true;
        stopBtn.disabled = false;
        startBtn.classList.add('recording-pulse'); // تأثير بصري (اختياري)
    };

    // عند توقف التسجيل
    recognition.onend = () => {
        statusText.textContent = "توقف التسجيل. اضغط 'ابدأ' للمتابعة.";
        startBtn.disabled = false;
        stopBtn.disabled = true;
    };

    // عند حدوث خطأ
    recognition.onerror = (event) => {
        statusText.textContent = "حدث خطأ: " + event.error;
        stopBtn.click();
    };

    // المعالج الأساسي: عند التقاط الصوت وتحويله لنص
    recognition.onresult = (event) => {
        let interimTranscript = ''; // النص المؤقت

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript + ' ';
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        // تحديث مربع النص
        finalTextArea.value = finalTranscript + interimTranscript;
    };

    // --- أزرار التحكم ---

    startBtn.addEventListener('click', () => {
        // إذا كان هناك نص سابق، نكمله ولا نمسحه إلا إذا ضغط المستخدم "مسح"
        finalTranscript = finalTextArea.value; 
        if(finalTranscript.length > 0 && !finalTranscript.endsWith(' ')) {
            finalTranscript += ' ';
        }
        recognition.start();
    });

    stopBtn.addEventListener('click', () => {
        recognition.stop();
    });

    clearBtn.addEventListener('click', () => {
        finalTextArea.value = '';
        finalTranscript = '';
        statusText.textContent = "تم مسح النص.";
    });

    // --- وظيفة تحميل PDF ---

    downloadBtn.addEventListener('click', () => {
        const textContent = finalTextArea.value;
        const fileName = pdfNameInput.value || 'document'; // الاسم الافتراضي

        if (textContent.trim() === '') {
            alert('لا يوجد نص لتحميله!');
            return;
        }

        // إعدادات ملف PDF
        const element = document.createElement('div');
        // نضيف النص داخل عنصر div مع تنسيق مناسب للغة العربية في الـ PDF
        element.innerHTML = `<div style="font-family: Arial; direction: rtl; text-align: right; font-size: 18px; line-height: 1.6;">
            <h2 style="text-align: center; color: #4a90e2;">موقع سلمى طيبة اللملم</h2>
            <hr style="margin-bottom: 20px;">
            <p>${textContent.replace(/\n/g, '<br>')}</p>
        </div>`;

        const opt = {
            margin:       1,
            filename:     `${fileName}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 }, // دقة عالية
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        // تحويل الـ HTML إلى PDF ثم تحميله
        html2pdf().set(opt).from(element).save();
    });
}
