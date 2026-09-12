document.addEventListener("DOMContentLoaded", () => {
    // --- Globale Variablen ---
    let faceScanInterval;
    let selectedSongData = null;
    let bgAudio = null;
    const body = document.body;

    // --- Screen 1: Start ---
    const btnTest = document.getElementById("btn-test");
    btnTest.addEventListener("click", startCameraScan);

    // --- Screen 2: Kamera & Face Scan ---
    async function startCameraScan() {
        document.getElementById("screen-question").classList.add("hidden");
        document.getElementById("screen-camera").classList.remove("hidden");
        document.getElementById("scan-overlay").style.display = "block";

        const video = document.getElementById("video");
        
        // Kamera starten
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            video.srcObject = stream;
        } catch (err) {
            alert("Camera access denied! Imagine a scanner here... You are 100% pretty anyway! 🥰");
            explodeGraph(); // Fallback falls Kamera geblockt wird
            return;
        }

        // Face API Modelle laden (vom zuverlässigen CDN)
        const MODEL_URL = 'https://vladmandic.github.io/face-api/model/';
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);

        video.addEventListener('play', () => {
            let prettinessScore = 0;
            const bar = document.getElementById("prettiness-bar");

            faceScanInterval = setInterval(async () => {
                // Gesicht im Frame suchen
                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
                
                if (detections.length > 0) {
                    // Gesicht gefunden -> Score steigt
                    prettinessScore += 5;
                    bar.style.width = prettinessScore + "%";

                    if (prettinessScore >= 100) {
                        clearInterval(faceScanInterval);
                        // Kamera stoppen
                        video.srcObject.getTracks().forEach(track => track.stop());
                        explodeGraph();
                    }
                } else {
                    // Kein Gesicht? Score fällt leicht zurück (verhindert faken)
                    prettinessScore = Math.max(0, prettinessScore - 2);
                    bar.style.width = prettinessScore + "%";
                }
            }, 100); // Alle 100ms prüfen
        });
    }

    function explodeGraph() {
        const barContainer = document.querySelector(".progress-bar");
        barContainer.classList.add("explode");
        
        setTimeout(() => {
            // Nach Explosion zurück zu Screen 1, aber mit neuen Buttons
            document.getElementById("screen-camera").classList.add("hidden");
            document.getElementById("screen-question").classList.remove("hidden");
            document.getElementById("initial-buttons").classList.add("hidden");
            document.getElementById("result-buttons").classList.remove("hidden");
        }, 800);
    }

    // --- Screen 3: Yup / Nah ---
    const btnYup = document.getElementById("btn-yup");
    const btnNah = document.getElementById("btn-nah");

    btnYup.addEventListener("click", () => {
        document.getElementById("screen-question").classList.add("hidden");
        document.getElementById("screen-name").classList.remove("hidden");
    });

    // Fliehender Button für Desktop (Mouseover)
    // Auf Touch-Geräten regelt das CSS (pointer-events: none)
    btnNah.addEventListener("mouseover", (e) => {
        if (window.matchMedia("(pointer: fine)").matches) {
            const x = Math.random() * (window.innerWidth - btnNah.clientWidth - 50);
            const y = Math.random() * (window.innerHeight - btnNah.clientHeight - 50);
            btnNah.style.position = "fixed";
            btnNah.style.left = `${Math.abs(x)}px`;
            btnNah.style.top = `${Math.abs(y)}px`;
        }
    });

    // --- Screen 4: Name & Komplimente ---
    const complimentsDict = {
        A:"Adorable", B:"Beautiful", C:"Cute", D:"Dazzling", E:"Elegant", F:"Fabulous",
        G:"Gorgeous", H:"Heavenly", I:"Incredible", J:"Joyful", K:"Kind", L:"Lovely",
        M:"Magical", N:"Nice", O:"Outstanding", P:"Perfect", Q:"Queenly", R:"Radiant",
        S:"Stunning", T:"Terrific", U:"Unique", V:"Vibrant", W:"Wonderful", X:"X-tra special",
        Y:"Youthful", Z:"Zealous"
    };

    document.getElementById("btn-name").addEventListener("click", () => {
        const name = document.getElementById("name-input").value.trim().toUpperCase();
        if(!name) return;
        
        const container = document.getElementById("compliment-container");
        container.innerHTML = "";
        
        // Input ausblenden
        document.querySelector(".input-group").style.display = "none";
        
        name.split("").forEach((letter, index) => {
            if(!complimentsDict[letter]) return; // Leerzeichen überspringen

            const div = document.createElement("div");
            div.className = "flying-letter";
            div.innerHTML = `${letter} <div class="compliment">${complimentsDict[letter]}</div>`;
            
            // Start in der Mitte
            div.style.left = "50vw";
            div.style.top = "50vh";
            container.appendChild(div);

            // Flug-Animation mit Delay
            setTimeout(() => {
                const angle = (index / name.length) * Math.PI * 2;
                const radius = Math.min(window.innerWidth, window.innerHeight) * 0.4;
                const endX = window.innerWidth/2 + Math.cos(angle) * radius;
                const endY = window.innerHeight/2 + Math.sin(angle) * radius;

                div.style.opacity = "1";
                div.style.left = `${endX}px`;
                div.style.top = `${endY}px`;
                div.style.transform = `scale(1.2) rotate(${Math.random()*20-10}deg)`;
            }, index * 300);
        });

        setTimeout(() => {
            document.getElementById("scroll-hint-1").classList.remove("hidden");
            body.style.overflowY = "auto"; // Erlaubt scrollen
            document.getElementById("screen-music").classList.remove("hidden");
        }, name.length * 300 + 1000);
    });

    // --- Screen 5: iTunes API Music Search ---
    let searchTimeout;
    const setupMusicSearch = (inputId, dropdownId, isFirst) => {
        const input = document.getElementById(inputId);
        const dropdown = document.getElementById(dropdownId);

        input.addEventListener("input", () => {
            clearTimeout(searchTimeout);
            const query = input.value.trim();
            if(query.length < 3) { dropdown.innerHTML = ""; return; }

            searchTimeout = setTimeout(async () => {
                const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5`);
                const data = await res.json();
                
                dropdown.innerHTML = "";
                data.results.forEach(track => {
                    const item = document.createElement("div");
                    item.className = "dropdown-item";
                    item.innerHTML = `<img src="${track.artworkUrl100}" alt="Cover"> 
                                      <div><strong>${track.trackName}</strong><br><small>${track.artistName}</small></div>`;
                    
                    item.addEventListener("click", () => {
                        input.value = `${track.trackName} - ${track.artistName}`;
                        dropdown.innerHTML = "";
                        if(isFirst && track.previewUrl) {
                            selectedSongData = track.previewUrl; // Audio Schnipsel speichern
                        }
                        checkAllSongsFilled();
                    });
                    dropdown.appendChild(item);
                });
            }, 500);
        });
    };

    setupMusicSearch("song-1", "dropdown-1", true);
    setupMusicSearch("song-2", "dropdown-2", false);
    setupMusicSearch("song-3", "dropdown-3", false);

    function checkAllSongsFilled() {
        const s1 = document.getElementById("song-1").value;
        const s2 = document.getElementById("song-2").value;
        const s3 = document.getElementById("song-3").value;
        if(s1 && s2 && s3) {
            document.getElementById("btn-music").classList.remove("hidden");
        }
    }

    // --- Screen 6: Music Taste Check ---
    document.getElementById("btn-music").addEventListener("click", () => {
        document.getElementById("screen-music-result").classList.remove("hidden");
        
        // Spiele Song 1 ab, wenn Vorschau vorhanden
        if(selectedSongData) {
            bgAudio = new Audio(selectedSongData);
            bgAudio.volume = 0.5;
            bgAudio.play().catch(e => console.log("Autoplay blocked, but that's ok."));
        }

        // Smooth Scroll hin
        document.getElementById("screen-music-result").scrollIntoView({ behavior: 'smooth' });

        setTimeout(() => {
            document.getElementById("music-loading").classList.add("hidden");
            document.getElementById("music-success").classList.remove("hidden");
            document.getElementById("screen-date-options").classList.remove("hidden");
        }, 3000); // 3 Sekunden Ladebalken
    });

    // --- Screen 7: Date Options ---
    const dateRadios = document.getElementsByName("date_opt");
    const dynamicInputs = document.getElementById("date-dynamic-inputs");
    const btnDateNext = document.getElementById("btn-date-next");

    dateRadios.forEach(radio => {
        radio.addEventListener("change", (e) => {
            dynamicInputs.classList.remove("hidden");
            btnDateNext.classList.remove("hidden");
            body.classList.remove("stargazing-mode"); // Reset
            
            const val = e.target.value;
            if(val === "cinema") {
                dynamicInputs.innerHTML = `<input type="text" class="song-input" placeholder="What's your favorite movie or series? 🍿">`;
            } else if(val === "dinner") {
                dynamicInputs.innerHTML = `<input type="text" class="song-input" placeholder="What or where do you want to eat? 🍕">`;
            } else if(val === "stars") {
                body.classList.add("stargazing-mode");
                dynamicInputs.innerHTML = `<p style="font-size:1.2rem; font-weight:bold;">Great choice, so we can watch the beautiful night-sky. It‘s nearly as beautiful as you. ✨</p>`;
            } else {
                dynamicInputs.innerHTML = `<input type="text" class="song-input" placeholder="Tell me your perfect idea! 💡">`;
            }
        });
    });

    btnDateNext.addEventListener("click", () => {
        document.getElementById("screen-calendar").classList.remove("hidden");
        document.getElementById("screen-calendar").scrollIntoView({ behavior: 'smooth' });
        renderCalendar();
    });

    // --- Screen 8: Kalender ---
    let currentDate = new Date();
    
    // Geblockte Daten Format: "T.M" (Keine führenden Nullen erforderlich)
    const blockedDates = ["26.9", "9.10", "10.10", "12.12"]; 

    function renderCalendar() {
        const grid = document.getElementById("cal-grid");
        const title = document.getElementById("cal-month-title");
        grid.innerHTML = "";
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        title.innerText = `${monthNames[month]} ${year}`;

        // Wochentage anpassen (Mo = 1, Su = 0 -> Mo=0, Su=6)
        let emptyCells = firstDay === 0 ? 6 : firstDay - 1;
        for(let i=0; i < emptyCells; i++) {
            grid.innerHTML += `<div></div>`;
        }

        for(let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const dayOfWeek = dateObj.getDay();
            const dateString = `${day}.${month + 1}`; // e.g. "26.9"

            const div = document.createElement("div");
            div.className = "cal-day";
            div.innerText = day;

            // Blockiere Mittwochs (3) und Freitags (5) sowie spezifische Daten oder Daten in der Vergangenheit
            const isPast = dateObj.setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
            
            if(dayOfWeek === 3 || dayOfWeek === 5 || blockedDates.includes(dateString) || isPast) {
                div.classList.add("disabled");
            } else {
                div.addEventListener("click", () => {
                    document.querySelectorAll(".cal-day").forEach(d => d.classList.remove("selected"));
                    div.classList.add("selected");
                    document.getElementById("selected-date-text").classList.remove("hidden");
                    document.getElementById("selected-date-text").innerText = `Selected: ${day}. ${monthNames[month]} ❤️`;
                    document.getElementById("btn-finish").classList.remove("hidden");
                });
            }
            grid.appendChild(div);
        }
    }

    document.getElementById("cal-month-prev").addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    document.getElementById("cal-month-next").addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // --- Screen 9: Finish ---
    document.getElementById("btn-finish").addEventListener("click", () => {
        body.classList.remove("stargazing-mode"); // Reset Background falls Sterne
        document.getElementById("screen-thanks").classList.remove("hidden");
        document.getElementById("screen-thanks").scrollIntoView({ behavior: 'smooth' });
        
        // Herz-Regen
        const heartShower = document.querySelector(".heart-shower");
        setInterval(() => {
            const heart = document.createElement("div");
            heart.innerText = ["🌸", "❤️", "💖", "🌷"][Math.floor(Math.random()*4)];
            heart.style.position = "absolute";
            heart.style.left = Math.random() * 100 + "vw";
            heart.style.top = "-5vh";
            heart.style.fontSize = Math.random() * 20 + 15 + "px";
            heart.style.transition = "top 3s linear, opacity 3s";
            heart.style.zIndex = "100";
            document.body.appendChild(heart);

            setTimeout(() => {
                heart.style.top = "105vh";
                heart.style.opacity = "0";
            }, 50);

            setTimeout(() => heart.remove(), 3000);
        }, 150);
    });
});
