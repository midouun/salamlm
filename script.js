document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. إعدادات الساعة والتاريخ
    // ==========================================
    function updateClock() {
        const now = new Date();
        
        // الوقت
        const timeString = now.toLocaleTimeString('ar-DZ', { hour12: false });
        document.getElementById('digital-clock').textContent = timeString;

        // التاريخ
        const dateString = now.toLocaleDateString('ar-DZ', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });
        document.getElementById('current-date').textContent = dateString;
    }
    setInterval(updateClock, 1000);
    updateClock(); // تشغيل فوري

    // ==========================================
    // 2. جلب مواقيت الصلاة (ولاية غرداية)
    // ==========================================
    async function getPrayerTimes() {
        const prayerList = document.getElementById('prayer-list');
        try {
            // استخدام API Aladhan لمدينة غرداية، الجزائر
            const response = await axios.get('https://api.aladhan.com/v1/timingsByCity', {
                params: {
                    city: 'Ghardaia',
                    country: 'Algeria',
                    method: 2 // الهيئة العامة للمساحة المصرية (أو يمكن استخدام الافتراضي)
                }
            });

            const timings = response.data.data.timings;
            // تصفية وعرض الصلوات الخمس + الشروق
            const prayersToShow = {
                'Fajr': 'الفجر',
                'Sunrise': 'الشروق',
                'Dhuhr': 'الظهر',
                'Asr': 'العصر',
                'Maghrib': 'المغرب',
                'Isha': 'العشاء'
            };

            prayerList.innerHTML = ''; // مسح "جاري التحميل"
            
            for (let [key, name] of Object.entries(prayersToShow)) {
                let time = timings[key];
                const li = document.createElement('li');
                li.innerHTML = `<span>${name}</span> <span>${time}</span>`;
                prayerList.appendChild(li);
            }

        } catch (error) {
            prayerList.innerHTML = '<li style="color:red">فشل جلب المواقيت. تأكد من الإنترنت.</li>';
            console.error(error);
        }
    }
    getPrayerTimes();

    // ==========================================
    // 3. تحويل الصوت إلى نص (محسن وسريع)
    // ==========================================
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-DZ'; // لهجة جزائرية/عربية
        recognition.continuous = true;
        recognition.interimResults = true; // السرعة في العرض

        const startBtn = document.getElementById('start-btn');
        const stopBtn = document.getElementById('stop-btn');
        const clearBtn = document.getElementById('clear-btn');
        const statusText = document.getElementById('status');
        const textArea = document.getElementById('final-text');

        let finalTranscript = '';

        recognition.onstart = () => {
            statusText.textContent = "جاري التسجيل... (الميكروفون نشط)";
            startBtn.disabled = true;
            stopBtn.disabled = false;
            statusText.style.color = "red";
        };

        recognition.onend = () => {
            statusText.textContent = "توقف التسجيل.";
            startBtn.disabled = false;
            stopBtn.disabled = true;
            statusText.style.color = "#e67e22";
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            textArea.value = finalTranscript + interimTranscript;
            // التمرير التلقائي للأسفل
            textArea.scrollTop = textArea.scrollHeight;
        };

        startBtn.onclick = () => {
            finalTranscript = textArea.value; 
            if(finalTranscript.length > 0 && !finalTranscript.endsWith(' ')) finalTranscript += ' ';
            recognition.start();
        };
        stopBtn.onclick = () => recognition.stop();
        clearBtn.onclick = () => {
            textArea.value = '';
            finalTranscript = '';
        };

    } else {
        alert("متصفحك لا يدعم هذه الميزة، يرجى استخدام Google Chrome");
    }

    // ==========================================
    // 4. تصدير PDF منمق واحترافي
    // ==========================================
    document.getElementById('download-btn').addEventListener('click', () => {
        const textContent = document.getElementById('final-text').value;
        const fileName = document.getElementById('pdf-name').value || 'ملف-صوتي-محول';

        if (!textContent.trim()) {
            alert("لا يوجد نص لتحويله!");
            return;
        }

        // تصميم محتوى الـ PDF الداخلي (HTML & CSS مضمن)
        // الخلفية: لون بيج فاتح (Munaqqa) + إطار
        // الخط: 14pt Cairo
        const element = document.createElement('div');
        element.innerHTML = `
            <div style="
                font-family: 'Cairo', sans-serif; 
                direction: rtl; 
                padding: 40px; 
                background-color: #faf9f6; 
                border: 2px solid #d35400; 
                min-height: 800px;
                color: #000;
            ">
                <div style="text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="color: #d35400; margin:0;">مشروع سلمى طيبة اللملم</h1>
                    <p style="color: #7f8c8d; margin-top:5px;">التاريخ: ${new Date().toLocaleDateString('ar-DZ')}</p>
                </div>
                
                <div style="
                    font-size: 14pt; 
                    line-height: 1.8; 
                    text-align: justify;
                ">
                    ${textContent.replace(/\n/g, '<br>')}
                </div>

                <div style="margin-top: 50px; text-align: left; font-size: 10pt; color: #aaa;">
                    تم الإنشاء تلقائياً بواسطة تطبيق سلمى - 2026
                </div>
            </div>
        `;

        const opt = {
            margin:       0, // الهوامش صفر لأننا وضعنا padding داخلي
            filename:     `${fileName}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    });
});
