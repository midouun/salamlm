document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. الساعة والتاريخ
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

    // ==========================================
    // 2. مواقيت الصلاة (غرداية)
    // ==========================================
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
            prayerList.innerHTML = '<li style="color:red">فشل جلب المواقيت</li>';
        }
    }
    getPrayerTimes();

    // ==========================================
    // 3. إذاعة القرآن الكريم (البث المباشر)
    // ==========================================
    const radioBtn = document.getElementById('radio-btn');
    const quranPlayer = document.getElementById('quran-player');
    const radioStatus = document.getElementById('radio-status');
    const liveIndicator = document.getElementById('live-indicator');
    const soundWave = document.getElementById('sound-wave');
    const icon = radioBtn.querySelector('i');
    let isRadioPlaying = false;

    radioBtn.addEventListener('click', () => {
        if (!isRadioPlaying) {
            quranPlayer.play().then(() => {
                isRadioPlaying = true;
                icon.classList.remove('fa-play');
                icon.classList.add('fa-pause');
                radioBtn.classList.add('playing');
                radioStatus.textContent = "جاري الاستماع للقرآن الكريم...";
                liveIndicator.classList.add('active');
                soundWave.classList.remove('hidden');
            }).catch(e => {
                console.error(e);
                alert("تأكد من اتصالك بالإنترنت لتشغيل البث");
            });
        } else {
            quranPlayer.pause();
            isRadioPlaying = false;
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            radioBtn.classList.remove('playing');
            radioStatus.textContent = "اضغط للاستماع بقلب خاشع";
            liveIndicator.classList.remove('active');
            soundWave.classList.add('hidden');
        }
    });

    // ==========================================
    // 4. تحويل الصوت إلى نص (المنطق الذكي)
    // ==========================================
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'ar-DZ'; 
        recognition.continuous = true; 
        recognition.interimResults = true; 

        const startBtn = document.getElementById('start-btn');
        const stopBtn = document.getElementById('stop-btn');
        const clearBtn = document.getElementById('clear-btn');
        const statusText = document.getElementById('status');
        const textArea = document.getElementById('final-text');

        let finalTranscript = ''; 
        let isRecording = false;  

        startBtn.onclick = () => {
            if (isRecording) return; 
            isRecording = true; 
            finalTranscript = textArea.value;
            if(finalTranscript.length > 0 && !finalTranscript.endsWith(' ')) finalTranscript += ' ';
            recognition.start();
            statusText.textContent = "الميكروفون نشط.. لن يتوقف حتى تضغطي إيقاف";
            statusText.style.color = "#e58e26";
            startBtn.disabled = true;
            stopBtn.disabled = false;
        };

        stopBtn.onclick = () => {
            isRecording = false; 
            recognition.stop();
            statusText.textContent = "تم إيقاف التسجيل.";
            statusText.style.color = "#2f3640";
            startBtn.disabled = false;
            stopBtn.disabled = true;
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
            textArea.scrollTop = textArea.scrollHeight;
        };

        // إعادة التشغيل التلقائي عند السكوت
        recognition.onend = () => {
            if (isRecording) {
                console.log("إعادة تشغيل الميكروفون...");
                recognition.start();
            } else {
                startBtn.disabled = false;
                stopBtn.disabled = true;
            }
        };

        clearBtn.onclick = () => {
            textArea.value = '';
            finalTranscript = '';
        };

    } else {
        alert("المتصفح لا يدعم الميزة. يرجى استخدام Google Chrome");
    }

    // ==========================================
    // 5. تصدير PDF بتنسيق منمق
    // ==========================================
    document.getElementById('download-btn').addEventListener('click', () => {
        const textContent = document.getElementById('final-text').value;
        const fileName = document.getElementById('pdf-name').value || 'وثيقة-صوتية';

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
                    تم الإنشاء في 2026 - جميع الحقوق محفوظة
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
