document.addEventListener("DOMContentLoaded", () => {
    let faceScanInterval;
    let selectedSongData = null;
    let bgAudio = null;
    const body = document.body;

    // Gesammelte Daten für das Backend
    let finalData = {
        name: "",
        songs: [],
        dateIdea: "",
        specificIdea: "",
        date: "",
        time: ""
    };

    // --- Sternenhimmel Generator ---
    function createStars() {
        const container = document.getElementById("stars-container");
        container.innerHTML = "";
        for (let i = 0; i < 150; i++) {
            let star = document.createElement("div");
            star.className = "star";
            star.style.left = Math.random() * 100 + "vw";
            star.style.top = Math.random() * 100 + "vh";
            star.style.width = Math.random() * 3 + 1 + "px";
            star.style.height = star.style.width;
            star.style.animationDuration = Math.random() * 3 + 1 + "s";
            star.style.animationDelay = Math.random() * 2 + "s";
            container.appendChild(star);
        }
    }
    createStars();

    // --- Geheimes Backend ---
    let secretClicks = 0;
    document.getElementById("secret-trigger").addEventListener("click", () => {
        secretClicks++;
        if (secretClicks >= 3) {
            let pwd = prompt("Admin Password:");
            if (pwd === "crush") {
                document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
                document.getElementById("screen-backend").classList.remove("hidden");
                loadBackendData();
            }
            secretClicks = 0;
        }
    });

    document.getElementById("btn-close-backend").addEventListener("click", () => {
        document.getElementById("screen-backend").classList.add("hidden");
        document.getElementById("screen-question").classList.remove("hidden");
    });

    function loadBackendData() {
        const dataStr = localStorage.getItem("crushData");
        const container = document.getElementById("backend-data");
        if (dataStr) {
            const d = JSON.parse(dataStr);
            container.innerHTML = `
                <p><strong>Name:</strong> ${d.name}</p>
                <p><strong>Songs:</strong> ${d.songs.join(", ")}</p>
                <p><strong>Date Type:</strong> ${d.dateIdea}</p>
                <p><strong>Specifics:</strong> ${d.specificIdea}</p>
                <p><strong>Date:</strong> ${d.date}</p>
                <p><strong>Time:</strong> ${d.time}</p>
            `;
        } else {
            container.innerHTML = "No data saved yet. She needs to finish the form on this device.";
        }
    }

    // --- Screen 1: Start ---
    document.getElementById("btn-test").addEventListener("click", () => {
        document.getElementById("screen-question").classList.add("hidden");
        document.getElementById("screen-camera").classList.remove("hidden");
        document.getElementById("scan-overlay").style.display = "block";
        startCameraScan();
    });

    // --- Screen 2: Kamera Scan ---
    async function startCameraScan() {
        const video = document.getElementById("video");
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            video.srcObject = stream;
        } catch (err) {
            alert("Camera access denied! We'll just assume you are 100% pretty anyway! 🥰");
            startGraphAnimation(); // Fallback
            return;
        }

        const MODEL_URL = 'https://vladmandic.github.io/face-api/model/';
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);

        let scanTime = 0;
        video.addEventListener('play', () => {
            faceScanInterval = setInterval(async () => {
                const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
                
                // Wir scannen für ca. 4 Sekunden (40 * 100ms), solange ein Gesicht da ist
                if (detections.length > 0) {
                    scanTime++;
                }
                
                if (scanTime >= 30) { // Nach ~3 Sekunden Gesicht im Bild
                    clearInterval(faceScanInterval);
                    video.srcObject.getTracks().forEach(track => track.stop()); // Kamera aus
                    startGraphAnimation();
                }
            }, 100);
        });
    }

    // --- Screen 3: Graph Animation ---
    function startGraphAnimation() {
        document.getElementById("screen-camera").classList.add("hidden");
        document.getElementById("screen-graph").classList.remove("hidden");
        
        const bar = document.getElementById("big-prettiness-bar");
        const percText = document.getElementById("graph-percentage");
        const statusText = document.getElementById("graph-status");
        
        let val = 0;
        let speed = 40; // ms per 1%

        let graphInterval = setInterval(() => {
            val++;
            bar.style.height = val + "%";
            percText.innerText = val + "%";

            if (val === 40) statusText.innerText = "Wow, numbers are rising fast...";
            if (val === 80) statusText.innerText = "Error: Prettiness levels are critically high!";

            if (val >= 100) {
                clearInterval(graphInterval);
                statusText.innerText = "OVERFLOW!";
                document.querySelector(".big-graph-container").classList.add("explode");
                
                setTimeout(() => {
                    document.getElementById("screen-graph").classList.add("hidden");
                    document.getElementById("screen-question").classList.remove("hidden");
                    document.getElementById("initial-buttons").classList.add("hidden");
                    document.getElementById("result-buttons").classList.remove("hidden");
                }, 1000);
            }
        }, speed);
    }

    // --- Screen 4: Yup / Nah ---
    const btnYup = document.getElementById("btn-yup");
    const btnNah = document.getElementById("btn-nah");

    btnYup.addEventListener("click", () => {
        document.getElementById("screen-question").classList.add("hidden");
        document.getElementById("screen-name").classList.remove("hidden");
    });

    // Fliehender Button - Angepasst für iPad (Mouse/Trackpad) vs Phone (Touch)
    function moveButton() {
        const x = Math.random() * (window.innerWidth - btnNah.clientWidth - 50);
        const y = Math.random() * (window.innerHeight - btnNah.clientHeight - 50);
        btnNah.style.position = "fixed";
        btnNah.style.left = `${Math.abs(x)}px`;
        btnNah.style.top = `${Math.abs(y)}px`;
    }

    btnNah.addEventListener("mouseenter", () => {
        // Auf Geräten mit Maus (inkl. iPad Trackpad) flieht der Button
        if (window.innerWidth > 768 || window.matchMedia("(hover: hover)").matches) {
            moveButton();
        }
    });

    btnNah.addEventListener("touchstart", (e) => {
        // Auf reinen Touch-Handys wird Klick einfach blockiert
        if (window.innerWidth <= 768) {
            e.preventDefault(); 
            btnNah.classList.add("disabled-on-mobile");
        } else {
            moveButton(); // Falls doch großes Touch-Display
        }
    });

    btnNah.addEventListener("click", (e) => {
        e.preventDefault(); // Kann nie geklickt werden
    });

    // --- Screen 5: Name & Komplimente ---
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
        
        finalData.name = document.getElementById("name-input").value; // Fürs Backend speichern
        const container = document.getElementById("compliment-container");
        container.innerHTML = "";
        
        document.querySelector(".input-group").style.display = "none";
        
        name.split("").forEach((letter, index) => {
            if(!complimentsDict[letter]) return;

            const div = document.createElement("div");
            div.className = "flying-letter";
            div.innerHTML = `${letter} <div class="compliment">${complimentsDict[letter]}</div>`;
            div.style.left = "50vw";
            div.style.top = "50vh";
            container.appendChild(div);

            setTimeout(() => {
                const angle = (index / name.length) * Math.PI * 2;
                const radius = Math.min(window.innerWidth, window.innerHeight) * 0.35;
                const endX = window.innerWidth/2 + Math.cos(angle) * radius - 20;
                const endY = window.innerHeight/2 + Math.sin(angle) * radius - 30;

                div.style.opacity = "1";
                div.style.left = `${endX}px`;
                div.style.top = `${endY}px`;
                div.style.transform = `scale(1.2) rotate(${Math.random()*20-10}deg)`;
            }, index * 300);
        });

        setTimeout(() => {
            document.getElementById("scroll-hint-1").classList.remove("hidden");
            body.style.overflowY = "auto"; 
            document.getElementById("screen-music").classList.remove("hidden");
        }, name.length * 300 + 1000);
    });

    // --- Screen 6: Music ---
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
                            selectedSongData = track.previewUrl;
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

    document.getElementById("btn-music").addEventListener("click", () => {
        finalData.songs = [
            document.getElementById("song-1").value,
            document.getElementById("song-2").value,
            document.getElementById("song-3").value
        ];

        document.getElementById("screen-music-result").classList.remove("hidden");
        
        if(selectedSongData) {
            bgAudio = new Audio(selectedSongData);
            bgAudio.volume = 0.5;
            bgAudio.play().catch(e => console.log("Audio blockiert"));
        }

        document.getElementById("screen-music-result").scrollIntoView({ behavior: 'smooth' });

        setTimeout(() => {
            document.getElementById("music-loading").classList.add("hidden");
            document.getElementById("music-success").classList.remove("hidden");
            document.getElementById("screen-date-options").classList.remove("hidden");
        }, 3000); 
    });

    // --- Screen 8: Date Options ---
    const dateRadios = document.getElementsByName("date_opt");
    const dynamicInputs = document.getElementById("date-dynamic-inputs");
    const btnDateNext = document.getElementById("btn-date-next");

    dateRadios.forEach(radio => {
        radio.addEventListener("change", (e) => {
            dynamicInputs.classList.remove("hidden");
            btnDateNext.classList.remove("hidden");
            body.classList.remove("stargazing-mode"); 
            
            const val = e.target.value;
            finalData.dateIdea = val;

            if(val === "cinema") {
                dynamicInputs.innerHTML = `<input type="text" id="specific-idea" class="song-input" placeholder="What's your favorite movie or series? 🍿">`;
            } else if(val === "dinner") {
                dynamicInputs.innerHTML = `<input type="text" id="specific-idea" class="song-input" placeholder="What or where do you want to eat? 🍕">`;
            } else if(val === "stars") {
                body.classList.add("stargazing-mode");
                dynamicInputs.innerHTML = `<p style="font-size:1.2rem; font-weight:bold;">Great choice, so we can watch the beautiful night-sky. It‘s nearly as beautiful as you. ✨</p>`;
            } else {
                dynamicInputs.innerHTML = `<input type="text" id="specific-idea" class="song-input" placeholder="Tell me your perfect idea! 💡">`;
            }
        });
    });

    btnDateNext.addEventListener("click", () => {
        const specInput = document.getElementById("specific-idea");
        finalData.specificIdea = specInput ? specInput.value : "Just Stargazing";

        document.getElementById("screen-calendar").classList.remove("hidden");
        document.getElementById("screen-calendar").scrollIntoView({ behavior: 'smooth' });
        renderCalendar();
    });

    // --- Screen 9: Kalender ---
    let currentDate = new Date();
    const blockedDates = ["26.9", "9.10", "10.10", "12.12"]; 

    function renderCalendar() {
        const grid = document.getElementById("cal-grid");
        const title = document.getElementById("cal-month-title");
        grid.innerHTML = "";
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1).getDay(); 
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        title.innerText = `${monthNames[month]} ${year}`;

        let emptyCells = firstDay === 0 ? 6 : firstDay - 1;
        for(let i=0; i < emptyCells; i++) grid.innerHTML += `<div></div>`;

        for(let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(year, month, day);
            const dayOfWeek = dateObj.getDay();
            const dateString = `${day}.${month + 1}`; 

            const div = document.createElement("div");
            div.className = "cal-day";
            div.innerText = day;

            const isPast = dateObj.setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
            
            if(dayOfWeek === 3 || dayOfWeek === 5 || blockedDates.includes(dateString) || isPast) {
                div.classList.add("disabled");
            } else {
                div.addEventListener("click", () => {
                    document.querySelectorAll(".cal-day").forEach(d => d.classList.remove("selected"));
                    div.classList.add("selected");
                    document.getElementById("selected-date-text").classList.remove("hidden");
                    document.getElementById("selected-date-text").innerText = `Selected: ${day}. ${monthNames[month]} ❤️`;
                    
                    finalData.date = `${day}. ${monthNames[month]} ${year}`;
                    
                    // Zeit-Auswahl einblenden
                    document.getElementById("time-selection").classList.remove("hidden");
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

    document.getElementById("time-input").addEventListener("change", (e) => {
        if(e.target.value) {
            finalData.time = e.target.value;
            document.getElementById("btn-finish").classList.remove("hidden");
        }
    });

    // --- Screen 10: Finish & Daten speichern ---
    document.getElementById("btn-finish").addEventListener("click", () => {
        // Daten im lokalen Speicher ablegen (für das Geheim-Dashboard)
        localStorage.setItem("crushData", JSON.stringify(finalData));

        // DATEN HEIMLICH AN DICH SENDEN (Formspree)
        fetch("https://formspree.io/f/mgaejwoa", {
            method: "POST",
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json' 
            },
            body: JSON.stringify(finalData)
        }).then(response => {
            console.log("Erfolgreich an Formspree gesendet!");
        }).catch(error => {
            console.error("Fehler beim Senden an Formspree:", error);
        });

        body.classList.remove("stargazing-mode");
        document.getElementById("screen-thanks").classList.remove("hidden");
        document.getElementById("screen-thanks").scrollIntoView({ behavior: 'smooth' });
        
        setInterval(() => {
            const heart = document.createElement("div");
            heart.innerText = ["🌸", "❤️", "💖", "✨"][Math.floor(Math.random()*4)];
            heart.style.position = "absolute";
            heart.style.left = Math.random() * 100 + "vw";
            heart.style.top = "-5vh";
            heart.style.fontSize = Math.random() * 20 + 15 + "px";
            heart.style.transition = "top 3s linear, opacity 3s";
            heart.style.zIndex = "100";
            document.body.appendChild(heart);

            setTimeout(() => { heart.style.top = "105vh"; heart.style.opacity = "0"; }, 50);
            setTimeout(() => heart.remove(), 3000);
        }, 150);
    });
});
