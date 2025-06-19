document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let courseSummary = [];
    let allCourses = [];
    let gpaChart = null;
    let currentSort = { column: 'grade', direction: 'desc' };
    let isSemesterMode = false;
    let currentlyEditingIndex = null;
    let rawPredictionGpas = [];

    // --- DOM ELEMENTS ---
    const messageBox = document.getElementById('message-box');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Navigation & Tabs
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    // Course Input
    const semesterDataToggle = document.getElementById('semester-data-toggle');
    const semesterOptions = document.getElementById('semester-options');
    const totalSemestersInput = document.getElementById('total-semesters');
    const csvUpload = document.getElementById('csv-upload');
    const csvInfo = document.getElementById('csv-info');
    const manualSemesterInputGroup = document.getElementById('manual-semester-input-group');
    const manualSemesterInput = document.getElementById('manual-semester');
    const gradeSelect = document.getElementById('grade-select');
    const courseCountInput = document.getElementById('course-count');
    const courseHoursInput = document.getElementById('course-hours');
    const addCourseBtn = document.getElementById('add-course-btn');
    const summaryTable = document.getElementById('course-summary-table');
    const summaryTableHead = summaryTable.querySelector('thead');
    const summaryTableBody = summaryTable.querySelector('tbody');
    const clearCoursesBtn = document.getElementById('clear-courses-btn');
    const addRowBtn = document.getElementById('add-row-btn');

    // Current Standing & Settings
    const currentGpaEl = document.getElementById('current-gpa');
    const totalCoursesEl = document.getElementById('total-courses');
    const totalHoursEl = document.getElementById('total-hours');
    const maxGradHoursInput = document.getElementById('max-grad-hours');
    const maxCourseHoursInput = document.getElementById('max-course-hours');
    const progressBar = document.getElementById('progress-bar');
    const progressionDetails = document.getElementById('progression-details');

    // Semester Analysis
    const semesterAnalysisSection = document.getElementById('semester-analysis-section');
    const semesterGpaTableBody = document.querySelector('#semester-gpa-table tbody');
    const chartCanvas = document.getElementById('gpa-chart');

    // Prediction
    const predictionNInput = document.getElementById('prediction-n');
    const predictionHoursInputsContainer = document.getElementById('prediction-hours-inputs');
    const runPredictionBtn = document.getElementById('run-prediction-btn');
    const resultsSection = document.getElementById('results-section');
    const predictionSummaryEl = document.getElementById('prediction-summary');
    const predictionTableBody = document.querySelector('#prediction-results-table tbody');
    const predictionFilter = document.getElementById('prediction-filter');
    const predictionFactorSlider = document.getElementById('prediction-factor-slider');
    const predictionFactorValue = document.getElementById('prediction-factor-value');

    // --- CONSTANTS & HELPERS ---
    const GPA_KEY = { "A": 4.0, "A-": 3.666, "B+": 3.333, "B": 3.0, "B-": 2.666, "C+": 2.333, "C": 2.0, "C-": 1.666, "D+": 1.333, "D": 1.0, "F": 0 };
    const ALL_GRADES = Object.keys(GPA_KEY);

    const showLoader = () => loadingOverlay.classList.remove('hidden');
    const hideLoader = () => loadingOverlay.classList.add('hidden');
   
    const showMessage = (message, type = 'error') => {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        messageBox.classList.remove('hidden');
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 5000);
    };

    // --- CORE LOGIC ---
    const calculateGpa = (courses) => {
        if (!courses || courses.length === 0) return 0;
        let totalPoints = courses.reduce((sum, course) => sum + (GPA_KEY[course.letter] * course.hours), 0);
        let totalHours = courses.reduce((sum, course) => sum + course.hours, 0);
        return totalHours === 0 ? 0 : totalPoints / totalHours;
    };

    const product = (arr, n) => {
        if (n === 0) return [[]];
        const result = [];
        const sub_product = product(arr, n - 1);
        for (const item of arr) for (const sub of sub_product) result.push([item, ...sub]);
        return result;
    }

    const subsequentCourseTest = (n, hours) => {
        if (n !== hours.length) {
            showMessage('Error: The number of future courses must match the number of credit hours provided.');
            return null;
        }
        const combinations = product(ALL_GRADES, n);
        return combinations.map(combo => {
            const futureCourses = combo.map((letter, index) => ({ letter, hours: hours[index] }));
            return calculateGpa([...allCourses, ...futureCourses]);
        });
    };

    // --- UI & DATA UPDATE FUNCTIONS ---
   
    const updateMaxHoursForAllInputs = () => {
        const maxHours = maxCourseHoursInput.value;
        courseHoursInput.max = maxHours;
        // Also update any visible edit fields
        summaryTableBody.querySelectorAll('.edit-hours').forEach(input => input.max = maxHours);
        // And prediction inputs
        predictionHoursInputsContainer.querySelectorAll('input').forEach(input => input.max = maxHours);
    };

    const toggleSemesterMode = () => {
        const willBeSemesterMode = semesterDataToggle.checked;
        if (willBeSemesterMode === isSemesterMode) return;
        isSemesterMode = willBeSemesterMode;
        if (isSemesterMode) {
            courseSummary.forEach(item => { if (item.semester === undefined) item.semester = 1; });
            csvInfo.innerHTML = "CSV must have headers: 'Grade', 'Count', 'Hours/Course', 'Semester'.";
        } else {
            courseSummary.forEach(item => delete item.semester);
            csvInfo.innerHTML = "CSV must have headers: 'Grade', 'Count', 'Hours/Course'.";
        }
        semesterOptions.classList.toggle('hidden', !isSemesterMode);
        manualSemesterInputGroup.classList.toggle('hidden', !isSemesterMode);
        summaryTable.querySelector('[data-sort="semester"]').classList.toggle('hidden', !isSemesterMode);
        renderSummaryTable();
        updateAllDisplays();
    };

    const sortSummaryTable = (column) => {
        const direction = (currentSort.column === column && currentSort.direction === 'asc') ? 'desc' : 'asc';
        currentSort = { column, direction };
        courseSummary.sort((a, b) => {
            let valA = a[column], valB = b[column];
            if (column === 'grade') { valA = GPA_KEY[a.grade]; valB = GPA_KEY[b.grade]; return direction === 'asc' ? valA - valB : valB - valA; }
            if (typeof valA === 'string') return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            return direction === 'asc' ? valA - valB : valB - valA;
        });
        renderSummaryTable();
        updateSortIcons();
    };

    const renderSummaryTable = () => {
        if (courseSummary.length === 0) {
            summaryTableBody.innerHTML = `<tr><td colspan="${isSemesterMode ? 5 : 4}" style="text-align:center;">No courses added yet.</td></tr>`;
            return;
        }
       
        summaryTableBody.innerHTML = ''; // Clear placeholder
        courseSummary.forEach((item, index) => {
            const row = document.createElement('tr');
            row.dataset.index = index;
            if (index === currentlyEditingIndex) {
                const gradeOptions = ALL_GRADES.map(g => `<option value="${g}" ${g === item.grade ? 'selected' : ''}>${g}</option>`).join('');
                const semesterInput = isSemesterMode ? `<td><input type="number" class="edit-semester" value="${item.semester || 1}" min="1" max="${totalSemestersInput.value}"></td>` : '';
                row.innerHTML = `
                    <td><select class="edit-grade">${gradeOptions}</select></td>
                    <td><input type="number" class="edit-count" value="${item.count}" min="1"></td>
                    <td><input type="number" class="edit-hours" value="${item.hours}" min="0" max="${maxCourseHoursInput.value}"></td>
                    ${semesterInput}
                    <td><button class="action-btn save-btn" data-index="${index}">Save</button><button class="action-btn cancel-btn" data-index="${index}">Cancel</button></td>`;
            } else {
                row.innerHTML = `
                    <td>${item.grade}</td><td>${item.count}</td><td>${item.hours}</td>
                    ${isSemesterMode ? `<td>${item.semester || 'N/A'}</td>` : ''}
                    <td><button class="action-btn edit-btn" data-index="${index}">Edit</button><button class="action-btn delete-btn" data-index="${index}">Remove</button></td>`;
            }
            summaryTableBody.appendChild(row);
        });
    };
   
    const updateSortIcons = () => {
        summaryTableHead.querySelectorAll('th[data-sort]').forEach(th => {
            const icon = th.querySelector('.sort-icon');
            icon.innerHTML = '';
            if (th.dataset.sort === currentSort.column) icon.innerHTML = currentSort.direction === 'asc' ? '&#9650;' : '&#9660;';
        });
    };
   
    const processAndRenderSemesterAnalysis = () => {
        if (!isSemesterMode || allCourses.length === 0 || allCourses.some(c => c.semester === undefined)) {
            semesterAnalysisSection.classList.add('hidden');
            return;
        }
        const coursesBySem = {};
        allCourses.forEach(course => { if (!coursesBySem[course.semester]) coursesBySem[course.semester] = []; coursesBySem[course.semester].push(course); });
        const semesterNumbers = Object.keys(coursesBySem).map(Number).sort((a, b) => a - b);
        const semesterGpas = semesterNumbers.map(semNum => calculateGpa(coursesBySem[semNum]));
        const cumulativeGpas = []; let cumulativeCourses = [];
        semesterNumbers.forEach(semNum => { cumulativeCourses.push(...coursesBySem[semNum]); cumulativeGpas.push(calculateGpa(cumulativeCourses)); });
        renderSemesterGpaChartAndTable(semesterNumbers, semesterGpas, cumulativeGpas);
    };
   
    const renderSemesterGpaChartAndTable = (labels, semesterData, cumulativeData) => {
        semesterGpaTableBody.innerHTML = '';
        labels.forEach((label, index) => { const row = document.createElement('tr'); row.innerHTML = `<td>${label}</td><td>${semesterData[index].toFixed(4)}</td><td>${cumulativeData[index].toFixed(4)}</td>`; semesterGpaTableBody.appendChild(row); });
        if (gpaChart) gpaChart.destroy();
        gpaChart = new Chart(chartCanvas, {
            type: 'line',
            data: { labels: labels.map(l => `Sem ${l}`), datasets: [{ label: 'Semester GPA', data: semesterData, borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)', fill: true, tension: 0.1 }, { label: 'Cumulative GPA', data: cumulativeData, borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', fill: true, tension: 0.1 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, suggestedMax: 4.0 } } }
        });
        semesterAnalysisSection.classList.remove('hidden');
    };

    const renderPredictionResults = (factor) => {
        if (rawPredictionGpas.length === 0) { resultsSection.classList.add('hidden'); return; }
        const factorNum = parseFloat(factor); predictionFactorValue.textContent = factorNum.toFixed(2);
        let gpaRanges = [{ range: [0.0 + factorNum, 1.0 + factorNum], count: 0 }, { range: [1.0 + factorNum, 2.0 + factorNum], count: 0 }, { range: [2.0 + factorNum, 3.0 + factorNum], count: 0 }, { range: [3.0 + factorNum, 4.0], count: 0 }];
        rawPredictionGpas.forEach(gpa => { for (const gpaRange of gpaRanges) { if (gpa >= gpaRange.range[0] && gpa <= gpaRange.range[1]) { gpaRange.count++; if (gpa === 4.0 && gpaRange.range[1] === 4.0) break; if (gpa !== gpaRange.range[0] || gpaRange.range[0] === 0.0 + factorNum) break; } } });
        predictionTableBody.innerHTML = '';
        gpaRanges.forEach(result => {
            const row = document.createElement('tr');
            const likelihood = rawPredictionGpas.length > 0 ? (result.count / rawPredictionGpas.length) : 0;
            const likelihoodPercent = (likelihood * 100).toFixed(2);
            row.innerHTML = `<td>${result.range[0].toFixed(2)} - ${result.range[1].toFixed(2)}</td><td>${likelihoodPercent}%</td><td class="viz-col"><div class="likelihood-bar-container"><div class="likelihood-bar" style="width: ${likelihoodPercent}%;">${likelihoodPercent > 15 ? likelihoodPercent + '%' : ''}</div></div></td>`;
            predictionTableBody.appendChild(row);
        });
        predictionFilter.classList.remove('hidden'); resultsSection.classList.remove('hidden');
    };

    const renderPredictionHoursInputs = () => {
        predictionHoursInputsContainer.innerHTML = '';
        const n = parseInt(predictionNInput.value, 10) || 0;
        const maxHours = maxCourseHoursInput.value;
        for (let i = 0; i < n; i++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.max = maxHours;
            input.value = maxHours; // Default to max
            input.setAttribute('aria-label', `Hours for course ${i + 1}`);
            predictionHoursInputsContainer.appendChild(input);
        }
    };

    const updateAllDisplays = () => {
        allCourses = courseSummary.flatMap(item => Array(item.count).fill(0).map(() => ({ letter: item.grade, hours: item.hours, ...(isSemesterMode && { semester: item.semester }) })));
        const currentGpa = calculateGpa(allCourses);
        const totalHours = allCourses.reduce((sum, course) => sum + course.hours, 0);
        const totalCourses = allCourses.length;
        currentGpaEl.textContent = currentGpa.toFixed(4);
        totalCoursesEl.textContent = totalCourses; totalHoursEl.textContent = totalHours;
        const maxGradHours = parseInt(maxGradHoursInput.value, 10) || 140;
        const progressPercent = maxGradHours > 0 ? Math.min((totalHours / maxGradHours) * 100, 100) : 0;
        progressBar.style.width = `${progressPercent}%`;
        progressionDetails.textContent = `${totalHours} / ${maxGradHours} Hours (${progressPercent.toFixed(2)}%)`;
        
        // Enable or disable the prediction button based on whether courses exist
        runPredictionBtn.disabled = allCourses.length === 0;

        processAndRenderSemesterAnalysis();
    };
   
    const clearAllData = () => {
        courseSummary = []; allCourses = []; rawPredictionGpas = []; currentlyEditingIndex = null;
        if (gpaChart) gpaChart.destroy(); gpaChart = null;
        semesterAnalysisSection.classList.add('hidden'); resultsSection.classList.add('hidden'); predictionFilter.classList.add('hidden');
        csvUpload.value = '';
        renderSummaryTable();
        updateAllDisplays();
    };

    // --- EVENT HANDLERS ---
    
    // Tab switching
    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tab = link.dataset.tab;

            tabLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            tabContents.forEach(content => {
                if (content.id === `${tab}-tab-content`) {
                    content.classList.add('active');
                    content.classList.remove('hidden');
                } else {
                    content.classList.remove('active');
                    content.classList.add('hidden');
                }
            });
        });
    });

    maxCourseHoursInput.addEventListener('input', updateMaxHoursForAllInputs);
    semesterDataToggle.addEventListener('change', toggleSemesterMode);
   
    addCourseBtn.addEventListener('click', () => {
        const grade = gradeSelect.value;
        const count = parseInt(courseCountInput.value, 10);
        const hours = parseInt(courseHoursInput.value, 10);
        const semester = parseInt(manualSemesterInput.value, 10);
        const maxHours = parseInt(maxCourseHoursInput.value, 10);
        const totalSemesters = parseInt(totalSemestersInput.value, 10);
        if (count <= 0 || isNaN(count)) return showMessage('Please enter a valid number of courses.');
        if (isNaN(hours) || hours < 0 || hours > maxHours) return showMessage(`Please enter valid hours (0-${maxHours}).`);
        if (isSemesterMode && (isNaN(semester) || semester <= 0 || semester > totalSemesters)) return showMessage(`Please enter a valid semester number (1-${totalSemesters}).`);
        const newCourse = { grade, count, hours };
        if (isSemesterMode) newCourse.semester = semester;
        const existingEntry = courseSummary.find(item => item.grade === newCourse.grade && item.hours === newCourse.hours && (!isSemesterMode || item.semester === newCourse.semester));
        if (existingEntry) existingEntry.count += count; else courseSummary.push(newCourse);
        sortSummaryTable(currentSort.column); updateAllDisplays();
    });

    summaryTableBody.addEventListener('click', (e) => {
        const target = e.target;
        const row = target.closest('tr');
        if (!row) return;
        const index = parseInt(row.dataset.index, 10);
        if (target.classList.contains('delete-btn')) { currentlyEditingIndex = null; courseSummary.splice(index, 1); sortSummaryTable(currentSort.column); updateAllDisplays(); }
        else if (target.classList.contains('edit-btn')) { currentlyEditingIndex = index; renderSummaryTable(); }
        else if (target.classList.contains('cancel-btn')) { currentlyEditingIndex = null; renderSummaryTable(); }
        else if (target.classList.contains('save-btn')) {
            const grade = row.querySelector('.edit-grade').value;
            const count = parseInt(row.querySelector('.edit-count').value, 10);
            const hours = parseInt(row.querySelector('.edit-hours').value, 10);
            const maxHours = parseInt(maxCourseHoursInput.value, 10);
            if (isNaN(count) || count <= 0) return showMessage('Course count must be > 0.');
            if (isNaN(hours) || hours < 0 || hours > maxHours) return showMessage(`Credit hours must be 0-${maxHours}.`);
            const updatedCourse = { grade, count, hours };
            if (isSemesterMode) {
                const semester = parseInt(row.querySelector('.edit-semester').value, 10);
                const totalSemesters = parseInt(totalSemestersInput.value, 10);
                if (isNaN(semester) || semester <= 0 || semester > totalSemesters) return showMessage(`Please enter a valid semester number (1-${totalSemesters}).`);
                updatedCourse.semester = semester;
            }
            courseSummary[index] = updatedCourse;
            currentlyEditingIndex = null;
            sortSummaryTable(currentSort.column);
            updateAllDisplays();
        }
    });

    summaryTableHead.addEventListener('click', (e) => { const header = e.target.closest('th[data-sort]'); if (header) sortSummaryTable(header.dataset.sort); });
    clearCoursesBtn.addEventListener('click', () => { if (confirm('Are you sure you want to clear all added courses?')) clearAllData(); });

    addRowBtn.addEventListener('click', () => {
        if (currentlyEditingIndex !== null) return showMessage('Please save or cancel your current edit first.');
        const newCourse = { grade: 'A', count: 1, hours: parseInt(maxCourseHoursInput.value, 10) };
        if (isSemesterMode) newCourse.semester = 1;
        courseSummary.push(newCourse);
        currentlyEditingIndex = courseSummary.length - 1;
        renderSummaryTable();
        summaryTable.parentElement.scrollTop = summaryTable.parentElement.scrollHeight;
    });

    maxGradHoursInput.addEventListener('input', updateAllDisplays);
    totalSemestersInput.addEventListener('input', () => { manualSemesterInput.max = totalSemestersInput.value; });
    predictionNInput.addEventListener('input', renderPredictionHoursInputs);
    predictionFactorSlider.addEventListener('input', (e) => renderPredictionResults(e.target.value));

    runPredictionBtn.addEventListener('click', () => {
        const n = parseInt(predictionNInput.value, 10);
        if (isNaN(n) || n <= 0) return showMessage('Please enter a valid number of future courses.');
        
        // Safeguard for performance
        if (n > 7) {
            return showMessage('Prediction disabled for more than 7 courses to prevent performance issues.');
        }
       
        const hourInputs = [...predictionHoursInputsContainer.querySelectorAll('input')];
        const hours = hourInputs.map(input => parseInt(input.value, 10));
        const maxHours = parseInt(maxCourseHoursInput.value, 10);

        if (hours.some(h => isNaN(h) || h < 0 || h > maxHours)) return showMessage(`Please provide valid credit hours for all ${n} courses (0-${maxHours}).`);

        showLoader();
        setTimeout(() => {
            const results = subsequentCourseTest(n, hours);
            if (results) {
                rawPredictionGpas = results;
                predictionSummaryEl.textContent = `Found ${rawPredictionGpas.length.toLocaleString()} possible outcomes for ${n} future course(s).`;
                predictionFactorSlider.value = 0;
                renderPredictionResults("0");
            }
            hideLoader();
        }, 50);
    });

    csvUpload.addEventListener('change', (event) => {
        const file = event.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try { parseAndLoadCSV(e.target.result); showMessage('CSV data loaded successfully!', 'success'); }
            catch (error) { showMessage(`CSV Error: ${error.message}`); csvUpload.value = ''; }
        };
        reader.readAsText(file);
    });

    const parseAndLoadCSV = (text) => {
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) throw new Error("CSV is empty or has only a header.");
        const header = lines[0].split(',').map(h => h.trim());
        const requiredHeaders = ['Grade', 'Count', 'Hours/Course'];
        if (isSemesterMode) requiredHeaders.push('Semester');
        if (!requiredHeaders.every(h => header.includes(h))) throw new Error(`CSV must include headers: ${requiredHeaders.join(', ')}.`);
        const gradeIndex = header.indexOf('Grade'), countIndex = header.indexOf('Count'), hoursIndex = header.indexOf('Hours/Course'), semesterIndex = isSemesterMode ? header.indexOf('Semester') : -1;
        const totalSemesters = parseInt(totalSemestersInput.value, 10);
        const maxHours = parseInt(maxCourseHoursInput.value, 10);
        const newCoursesFromCSV = [];
        for (let i = 1; i < lines.length; i++) {
            const data = lines[i].split(',');
            const grade = data[gradeIndex].trim().toUpperCase();
            const count = parseInt(data[countIndex].trim(), 10);
            const hours = parseInt(data[hoursIndex].trim(), 10);
            if (!ALL_GRADES.includes(grade)) throw new Error(`Invalid grade "${grade}" on line ${i + 1}.`);
            if (isNaN(count) || count < 0) throw new Error(`Invalid count on line ${i + 1}.`);
            if (isNaN(hours) || hours < 0 || hours > maxHours) throw new Error(`Invalid hours on line ${i + 1} (must be 0-${maxHours}).`);
            const newCourse = { grade, count, hours };
            if (isSemesterMode) {
                const semester = parseInt(data[semesterIndex].trim(), 10);
                if (isNaN(semester) || semester <= 0 || semester > totalSemesters) throw new Error(`Invalid semester on line ${i + 1} (1-${totalSemesters}).`);
                newCourse.semester = semester;
            }
            newCoursesFromCSV.push(newCourse);
        }
        clearAllData();
        newCoursesFromCSV.forEach(newCourse => {
             const existingEntry = courseSummary.find(item => item.grade === newCourse.grade && item.hours === newCourse.hours && (!isSemesterMode || item.semester === newCourse.semester));
             if (existingEntry) existingEntry.count += newCourse.count; else courseSummary.push(newCourse);
        });
        sortSummaryTable(currentSort.column); updateAllDisplays();
    };

    // --- INITIALIZATION ---
    updateMaxHoursForAllInputs();
    renderPredictionHoursInputs();
    renderSummaryTable();
    updateSortIcons();
    updateAllDisplays();
});
