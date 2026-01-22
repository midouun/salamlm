document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. الساعة والتاريخ ومواقيت الصلاة
    // ==========================================
    function updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ar-DZ', { hour12: false });
        document.getElementById('digital-clock').textContent = timeString;
        const dateString = now.toLocaleDateString('ar-DZ', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });
        document.getElementById('current-date').textContent = dateString;
    }
    setInterval(updateClock, 1000);
    updateClock();

    async function getPrayerTimes() {
        const prayerList = document.getElementById('prayer-list');
        try {
            const response = await axios.get('https://api.aladhan.com/v1/timingsByCity', {
                params: { city: 'Ghardaia', country: 'Algeria', method: 2 }
            });
            const timings = response.data.data.timings;
            const prayersToShow = { 'Fajr': 'الفجر', 'Sunrise': 'الشروق', 'Dhuhr': 'الظهر', 'Asr': 'العصر', 'Maghrib': 'المغرب', 'Isha': 'العشاء' };

            prayerList.innerHTML = ''; 
            for (let [key, name] of Object.entries(prayersToShow)) {
                const li = document.createElement('li');
                li.innerHTML = `<span>${name}</span> <span>${timings[key]}</span>`;
                prayerList.appendChild(li);
            }
        } catch (error) {
            prayerList.innerHTML = '<li style="color:red">تأكد من الاتصال بالإنترنت</li>';
        }
    }
    getPrayerTimes();

    // ==========================================
    // 2. المحرك الذكي لتحويل الصوت (الإصلاح الجذري)
    // ==========================================
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        
        // إعدادات الدقة
        recognition.lang = 'ar-DZ'; 
        recognition.continuous = true; // الاستمرار
        recognition.interimResults = true; // النتائج الفورية

        // المتغيرات
        const startBtn = document.getElementById('start-btn');
        const stopBtn = document.getElementById('stop-btn');
        const clearBtn = document.getElementById('clear-btn');
        const statusText = document.getElementById('status');
        const textArea = document.getElementById('final-text');

        let finalTranscript = ''; // المخزن الرئيسي للنص المعتمد
        let isRecording = false;  // مفتاح التحكم اليدوي (مهم جداً لمنع التوقف)

        // --- عند بدء التسجيل ---
        startBtn.onclick = () => {
            if (isRecording) return; // منع الضغط المزدوج
            
            isRecording = true; // المستخدم يريد التسجيل
            
            // تحديث المخزن بالنص الموجود حالياً في الصندوق (حتى لا نفقده)
            finalTranscript = textArea.value;
            if(finalTranscript.length > 0 && !finalTranscript.endsWith(' ')) {
                finalTranscript += ' ';
            }

            recognition.start();
            
            // تحديث الواجهة
            statusText.textContent = "جاري الاستماع... (لن يتوقف حتى تضغطي إيقاف)";
            statusText.style.color = "#e58e26";
            startBtn.disabled = true;
            stopBtn.disabled = false;
        };

        // --- عند إيقاف التسجيل يدوياً ---
        stopBtn.onclick = () => {
            isRecording = false; // المستخدم يريد التوقف
            recognition.stop();
            
            statusText.textContent = "تم إيقاف التسجيل.";
            statusText.style.color = "#2f3640";
            startBtn.disabled = false;
            stopBtn.disabled = true;
        };

        // --- المعالجة الذكية للنص (منع التكرار) ---
        recognition.onresult = (event) => {
            let interimTranscript = ''; // نص مؤقت لهذه الجملة فقط

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcriptSegment = event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    // إذا تأكد المتصفح من النص، نضيفه للمخزن النهائي
                    finalTranscript += transcriptSegment + ' ';
                } else {
                    // إذا كان النص لا يزال قيد المعالجة
                    interimTranscript += transcriptSegment;
                }
            }

            // العرض: النص الثابت + النص المؤقت الحالي فقط
            textArea.value = finalTranscript + interimTranscript;
            
            // التمرير للأسفل
            textArea.scrollTop = textArea.scrollHeight;
        };

        // --- الحل السحري لمنع التوقف التلقائي ---
        recognition.onend = () => {
            if (isRecording) {
                // إذا توقف المتصفح (بسبب السكوت) ولكن المستخدم لم يضغط "إيقاف"
                // نعيد تشغيله فوراً
                console.log("إعادة تشغيل الميكروفون تلقائياً...");
                recognition.start();
            } else {
                // توقف حقيقي
                startBtn.disabled = false;
                stopBtn.disabled = true;
            }
        };

        // معالجة الأخطاء (مثل انقطاع النت)
        recognition.onerror = (event) => {
            console.error("Speech Error:", event.error);
            if (event.error === 'no-speech') {
                // تجاهل خطأ عدم وجود صوت واعمل إعادة تشغيل
                return; 
            }
            if (event.error === 'not-allowed') {
                statusText.textContent = "تم رفض الوصول للميكروفون!";
                isRecording = false;
            }
        };

        // زر المسح
        clearBtn.onclick = () => {
            textArea.value = '';
            finalTranscript = '';
        };

    } else {
        alert("المتصفح لا يدعم الميزة. يرجى استخدام Google Chrome");
    }

    // ==========================================
    // 3. تصدير PDF (نفس الكود السابق الممتاز)
    // ==========================================
    document.getElementById('download-btn').addEventListener('click', () => {
        const textContent = document.getElementById('final-text').value;
        const fileName = document.getElementById('pdf-name').value || 'ملف-صوتي-محول';

        if (!textContent.trim()) {
            alert("لا يوجد نص لتحويله!");
            return;
        }

        const element = document.createElement('div');
        element.innerHTML = `
            <div style="font-family: 'Cairo', sans-serif; direction: rtl; padding: 40px; background-color: #faf9f6; border: 2px solid #e58e26; min-height: 800px; color: #000;">
                <div style="text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="color: #e58e26; margin:0;">مشروع سلمى طيبة اللملم</h1>
                    <p style="color: #7f8c8d; margin-top:5px;">التاريخ: ${new Date().toLocaleDateString('ar-DZ')}</p>
                </div>
                <div style="font-size: 14pt; line-height: 1.8; text-align: justify;">
                    ${textContent.replace(/\n/g, '<br>')}
                </div>
                <div style="margin-top: 50px; text-align: left; font-size: 10pt; color: #aaa;">
                    تم الإنشاء تلقائياً بواسطة تطبيق سلمى - 2026
                </div>
            </div>
        `;

        const opt = {
            margin: 0,
            filename: `${fileName}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    });
});
