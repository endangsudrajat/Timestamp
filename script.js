        // Variabel global
        let originalImage = null;
        let currentRotation = 0;
        let isFlipped = false;
        let canvas = document.getElementById('imagePreview');
        let ctx = canvas.getContext('2d');
        
        // Load provinsi dan kota
        document.addEventListener('DOMContentLoaded', function() {
            loadProvinces();
            setDefaultDateTime();
            
            // Event listener untuk upload gambar
            document.getElementById('imageUpload').addEventListener('change', function(e) {
                if (e.target.files && e.target.files[0]) {
                    // Validasi ukuran file
                    if (e.target.files[0].size > 5 * 1024 * 1024) {
                        alert('Ukuran file terlalu besar. Maksimal 5MB.');
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        originalImage = new Image();
                        originalImage.onload = function() {
                            updateCanvas();
                            updateResolutionInfo();
                            // Update label upload
                            document.querySelector('.file-upload-label i').className = 'fas fa-check-circle';
                            document.querySelector('.file-upload-label span').textContent = e.target.files[0].name;
                            document.querySelector('.file-upload-label .small').textContent = 
                                `${Math.round(e.target.files[0].size / 1024)}KB | ${originalImage.width}×${originalImage.height}px`;
                        };
                        originalImage.src = event.target.result;
                    };
                    reader.readAsDataURL(e.target.files[0]);
                }
            });
            
            // Event listener untuk semua kontrol
            const controls = ['timestamp', 'province', 'city', 'additionalText', 
                            'textColor', 'bgColor', 'bgOpacity', 'textPosition'];
            controls.forEach(controlId => {
                document.getElementById(controlId).addEventListener('change', updateCanvas);
            });
            
            // Update warna label
            document.getElementById('textColor').addEventListener('change', function() {
                document.querySelector('.color-input span:nth-of-type(1)').textContent = 
                    this.value === '#ffffff' ? 'Putih' : this.value;
            });
            
            document.getElementById('bgColor').addEventListener('change', function() {
                document.querySelector('.color-input span:nth-of-type(2)').textContent = 
                    this.value === '#000000' ? 'Hitam' : this.value;
            });
        });
        
        // Fungsi untuk mengatur waktu default ke waktu sekarang
        function setDefaultDateTime() {
            const now = new Date();
            const timezoneOffset = now.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(now - timezoneOffset)).toISOString().slice(0, 16);
            document.getElementById('timestamp').value = localISOTime;
        }
        
        // Fungsi untuk memuat daftar provinsi
        function loadProvinces() {
            fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
                .then(response => response.json())
                .then(provinces => {
                    const select = document.getElementById('province');
                    provinces.forEach(province => {
                        const option = document.createElement('option');
                        option.value = province.id;
                        option.textContent = province.name;
                        select.appendChild(option);
                    });
                })
                .catch(error => {
                    console.error('Error loading provinces:', error);
                    // Fallback data jika API tidak tersedia
                    const fallbackProvinces = [
                        {id: '11', name: 'ACEH'},
                        {id: '12', name: 'SUMATERA UTARA'},
                        // Tambahkan provinsi lainnya...
                    ];
                    const select = document.getElementById('province');
                    fallbackProvinces.forEach(province => {
                        const option = document.createElement('option');
                        option.value = province.id;
                        option.textContent = province.name;
                        select.appendChild(option);
                    });
                });
        }
        
        // Fungsi untuk memuat daftar kota berdasarkan provinsi
        function loadCities() {
            const provinceId = document.getElementById('province').value;
            if (!provinceId) return;
            
            fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`)
                .then(response => response.json())
                .then(cities => {
                    const select = document.getElementById('city');
                    select.innerHTML = '<option value="">Pilih Kota/Kabupaten</option>';
                    cities.forEach(city => {
                        const option = document.createElement('option');
                        option.value = city.name;
                        option.textContent = city.name;
                        select.appendChild(option);
                    });
                })
                .catch(error => {
                    console.error('Error loading cities:', error);
                    // Fallback data jika API tidak tersedia
                    const fallbackCities = {
                        '11': [
                            {name: 'KABUPATEN SIMEULUE'},
                            {name: 'KABUPATEN ACEH SINGKIL'},
                            // Tambahkan kota lainnya...
                        ],
                        // Tambahkan provinsi lainnya...
                    };
                    
                    const select = document.getElementById('city');
                    select.innerHTML = '<option value="">Pilih Kota/Kabupaten</option>';
                    
                    if (fallbackCities[provinceId]) {
                        fallbackCities[provinceId].forEach(city => {
                            const option = document.createElement('option');
                            option.value = city.name;
                            option.textContent = city.name;
                            select.appendChild(option);
                        });
                    }
                });
        }
        
        // Fungsi untuk memperbarui canvas dengan gambar dan teks
        function updateCanvas() {
            if (!originalImage) return;
            
            // Hitung ukuran canvas berdasarkan rotasi
            let width, height;
            if (currentRotation % 180 === 0) {
                width = originalImage.width;
                height = originalImage.height;
            } else {
                width = originalImage.height;
                height = originalImage.width;
            }
            
            // Set ukuran canvas
            canvas.width = width;
            canvas.height = height;
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Simpan state canvas
            ctx.save();
            
            // Pindahkan origin ke tengah canvas untuk rotasi
            ctx.translate(canvas.width / 2, canvas.height / 2);
            
            // Rotasi canvas
            ctx.rotate(currentRotation * Math.PI / 180);
            
            // Flip gambar jika diperlukan
            const scaleX = isFlipped ? -1 : 1;
            ctx.scale(scaleX, 1);
            
            // Gambar gambar
            ctx.drawImage(
                originalImage, 
                -originalImage.width / 2, 
                -originalImage.height / 2, 
                originalImage.width, 
                originalImage.height
            );
            
            // Kembalikan state canvas
            ctx.restore();
            
            // Tambahkan teks jika ada
            addTextToCanvas();
            
            updateResolutionInfo();
        }
        
        // Fungsi untuk menambahkan teks ke canvas dengan latar yang sesuai
        function addTextToCanvas() {
            const timestamp = document.getElementById('timestamp').value;
            const city = document.getElementById('city').value;
            const additionalText = document.getElementById('additionalText').value;
            const textColor = document.getElementById('textColor').value;
            const bgColor = document.getElementById('bgColor').value;
            const bgOpacity = document.getElementById('bgOpacity').value / 100;
            const position = document.getElementById('textPosition').value;
            
            if (!timestamp && !city && !additionalText) return;
            
            // Format teks
            let textLines = [];
            
            // Format tanggal
            if (timestamp) {
                const date = new Date(timestamp);
                const options = { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZoneName: 'short'
                };
                const formattedDate = date.toLocaleDateString('id-ID', options);
                textLines.push(formattedDate);
            }
            
            // Tambahkan lokasi
            if (city) {
                textLines.push(city + ', Indonesia');
            }
            
            // Tambahkan teks tambahan
            if (additionalText) {
                textLines.push(additionalText);
            }
            
            if (textLines.length === 0) return;
            
            // Hitung ukuran teks berdasarkan ukuran gambar
            const baseFontSize = Math.max(canvas.width, canvas.height) * 0.012;
            const fontSize = Math.min(Math.max(baseFontSize, 12), 24); // Minimal 12px, maksimal 24px
            const lineHeight = fontSize * 1.2;
            const paddingH = fontSize * 0.8; // Padding horizontal
            const paddingV = fontSize * 0.5; // Padding vertikal
            
            ctx.font = `bold ${fontSize}px Arial, sans-serif`;
            
            // Hitung dimensi teks
            let maxTextWidth = 0;
            textLines.forEach(line => {
                const textWidth = ctx.measureText(line).width;
                if (textWidth > maxTextWidth) maxTextWidth = textWidth;
            });
            
            const totalTextHeight = textLines.length * lineHeight;
            
            // Tentukan posisi
            let x, y, textAlign;
            let bgX, bgY, bgWidth, bgHeight;
            
            switch (position) {
                case 'bottom-right':
                    textAlign = 'right';
                    x = canvas.width - paddingH - 5;
                    y = canvas.height - paddingV - totalTextHeight;
                    bgX = canvas.width - maxTextWidth - paddingH * 2;
                    bgY = canvas.height - totalTextHeight - paddingV * 2;
                    bgWidth = maxTextWidth + paddingH * 2;
                    bgHeight = totalTextHeight + paddingV * 2;
                    break;
                case 'bottom-left':
                    textAlign = 'left';
                    x = paddingH + 5;
                    y = canvas.height - paddingV - totalTextHeight;
                    bgX = paddingH;
                    bgY = canvas.height - totalTextHeight - paddingV * 2;
                    bgWidth = maxTextWidth + paddingH * 2;
                    bgHeight = totalTextHeight + paddingV * 2;
                    break;
                case 'top-right':
                    textAlign = 'right';
                    x = canvas.width - paddingH - 5;
                    y = paddingV + fontSize;
                    bgX = canvas.width - maxTextWidth - paddingH * 2;
                    bgY = paddingV;
                    bgWidth = maxTextWidth + paddingH * 2;
                    bgHeight = totalTextHeight + paddingV * 2;
                    break;
                case 'top-left':
                    textAlign = 'left';
                    x = paddingH + 5;
                    y = paddingV + fontSize;
                    bgX = paddingH;
                    bgY = paddingV;
                    bgWidth = maxTextWidth + paddingH * 2;
                    bgHeight = totalTextHeight + paddingV * 2;
                    break;
            }
            
            // Gambar background teks (hanya sebesar teks)
            ctx.fillStyle = hexToRgba(bgColor, bgOpacity);
            ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
            
            // Gambar teks
            ctx.fillStyle = textColor;
            ctx.textAlign = textAlign;
            ctx.textBaseline = 'top';
            
            textLines.forEach((line, index) => {
                ctx.fillText(line, x, y + (index * lineHeight));
            });
        }
        
        // Fungsi untuk mengkonversi hex ke rgba
        function hexToRgba(hex, alpha) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        
        // Fungsi untuk memutar gambar
        function rotateImage(degrees) {
            currentRotation += degrees;
            if (currentRotation >= 360) currentRotation -= 360;
            if (currentRotation < 0) currentRotation += 360;
            updateCanvas();
        }
        
        // Fungsi untuk flip gambar
        function flipImage() {
            isFlipped = !isFlipped;
            updateCanvas();
        }
        
        // Fungsi untuk mengunduh gambar
        function downloadImage() {
            if (!originalImage) {
                alert('Silakan unggah gambar terlebih dahulu');
                return;
            }
            
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `foto-stamp-${timestamp}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
        }
        
        // Fungsi untuk menampilkan informasi resolusi
        function updateResolutionInfo() {
            if (originalImage) {
                const info = `Resolusi: ${canvas.width} × ${canvas.height} piksel | Rotasi: ${currentRotation}° ${isFlipped ? '| Flip Horizontal' : ''}`;
                document.getElementById('resolutionInfo').textContent = info;
            } else {
                document.getElementById('resolutionInfo').textContent = '';
            }
}