# GPAFlow

GPAFlow is a web application designed to help students track, analyze, and predict their Grade Point Average (GPA). It allows users to input past course data, manage semester-based information, and predict future GPA outcomes based on hypothetical course scenarios. The application is built using HTML, CSS, and JavaScript, with Chart.js for visualizations and a responsive design for accessibility across devices.

## Table of Contents
- [Features](#features)
- [Live Demo](#live-demo)
- [Installation](#installation)
- [Usage](#usage)
  - [Adding Past Courses](#adding-past-courses)
  - [Viewing Current Standing](#viewing-current-standing)
  - [Predicting Future GPA](#predicting-future-gpa)
  - [Semester-by-Semester Analysis](#semester-by-semester-analysis)
  - [Info & Usage Guide](#info--usage-guide)
- [File Structure](#file-structure)
- [Dependencies](#dependencies)
- [Technical Details](#technical-details)
  - [State Management](#state-management)
  - [Core Logic](#core-logic)
  - [UI Components](#ui-components)
  - [Event Handlers](#event-handlers)
- [Contributing](#contributing)
- [License](#license)

## Features
- **Course Input**: Add past courses manually or via CSV upload with validation for grade, count, and hours.
- **Semester Support**: Toggle semester-based tracking to analyze GPA per semester.
- **Editable Course Summary**: Sort, edit, add, or delete course entries directly in a table.
- **Current Standing**: Displays cumulative GPA, total courses, total hours, and progress toward graduation.
- **GPA Prediction Tool**: Simulate future GPA outcomes for up to 7 courses, with dynamic credit hour inputs and a GPA range filter (0 to 0.9).
- **Semester Analysis**: Visualize semester and cumulative GPA trends with a line chart and data table.
- **Responsive Design**: Optimized for desktop and mobile devices using a grid layout and Inter font.
- **GitHub Integration**: Links to the project repository for contributions.

## Live Demo
You can access the live version of GPAFlow at [https://gpaflow.netlify.app/](https://gpaflow.netlify.app/).

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yaseen454/GPAFlow.git
   ```
2. Navigate to the project directory:
   ```bash
   cd GPAFlow
   ```
3. Open `index.html` in a web browser. No server setup is required as the app runs client-side.

Alternatively, host the files on a web server (e.g., using a local server like `live-server` or a hosting platform like Netlify).

## Usage

### Adding Past Courses
1. **Toggle Semester Data**: Enable the "Consider Semester Data" checkbox to track courses by semester. Specify the total number of semesters (default: 8).
2. **CSV Upload**:
   - Upload a CSV file with headers: `Grade`, `Count`, `Hours/Course` (and `Semester` if semester mode is enabled).
   - Example CSV format (without semester):
     ```csv
     Grade,Count,Hours/Course
     A,2,3
     B+,1,3
     ```
   - Example CSV format (with semester):
     ```csv
     Grade,Count,Hours/Course,Semester
     A,2,3,1
     B+,1,3,2
     ```
   - Errors are shown for invalid grades, counts, hours, or semesters.
3. **Manual Entry**:
   - Select a grade (A to F), enter the number of courses, credit hours (0 to max, default 3), and semester (if enabled).
   - Click "Add Courses" to append to the course summary table.
4. **Course Summary Table**:
   - Sort by grade, count, hours, or semester (if enabled) by clicking column headers.
   - Edit rows inline by clicking "Edit", then "Save" or "Cancel".
   - Delete rows with "Remove" or clear all data with "Clear All Courses".
   - Add new rows with "Add Course".

### Viewing Current Standing
- Displays:
  - **Cumulative GPA**: Calculated from all entered courses.
  - **Total Courses**: Total number of courses entered.
  - **Total Hours**: Sum of credit hours.
  - **Overall Progression**: Progress bar showing hours completed vs. max graduation hours (default: 140).
- Adjust **Max Graduation Hours** and **Max Hours/Course** to customize calculations.

### Predicting Future GPA
1. Enter the number of future courses (n, max 7 to prevent performance issues).
2. Specify credit hours for each course in dynamically generated input fields (0 to max hours, default 3).
3. Click "Run Prediction" to calculate possible GPA outcomes.
4. View results in a table showing GPA ranges, likelihood percentages, and bar visualizations.
5. Use the GPA Range Factor slider (0 to 0.9) to filter GPA ranges without recalculating.

### Semester-by-Semester Analysis
- Available when "Consider Semester Data" is enabled and semester data is provided.
- Displays a line chart of semester and cumulative GPAs.
- Includes a table with exact GPA values per semester.

### Info & Usage Guide
- Access the "Info & Usage" tab for a detailed guide on all features and input requirements.

## File Structure
```
GPAFlow/
├── index.html       # Main HTML file with structure and UI
├── script.js        # JavaScript logic for functionality and state management
├── style.css        # CSS for styling and responsive design
└── README.md        # Project documentation
```

## Dependencies
- **Chart.js**: For rendering GPA charts (`https://cdn.jsdelivr.net/npm/chart.js`).
- **Google Fonts (Inter)**: For typography (`https://fonts.googleapis.com/css2?family=Inter`).

No external dependencies require installation as they are loaded via CDN.

## Technical Details

### State Management
- **courseSummary**: Array storing course entries (grade, count, hours, optional semester).
- **allCourses**: Flattened array of individual courses for calculations.
- **rawPredictionGpas**: Stores GPA outcomes from predictions.
- **isSemesterMode**: Tracks whether semester data is considered.
- **currentlyEditingIndex**: Tracks the row being edited in the course summary table.

### Core Logic
- **calculateGpa**: Computes GPA using a weighted average of grade points (A=4.0, A-=3.666, etc.) and credit hours.
- **product**: Generates all possible grade combinations for prediction (cartesian product).
- **subsequentCourseTest**: Calculates possible GPAs for future courses based on user inputs.
- **parseAndLoadCSV**: Validates and processes CSV uploads, ensuring correct headers and data ranges.

### UI Components
- **Navigation**: Tabs for "Home" and "Info & Usage", with a GitHub link.
- **Course Input Section**: Form for manual entry, CSV upload, and course summary table.
- **Current Standing**: Displays GPA, course count, hours, and progress bar.
- **Prediction Tool**: Dynamic inputs for future courses and a filterable results table.
- **Semester Analysis**: Chart.js line chart and table for semester-based GPA trends.

### Event Handlers
- **Tab Switching**: Toggles visibility of tab content.
- **Course Input**: Handles manual entry, CSV uploads, and table interactions (sort, edit, delete).
- **Prediction**: Triggers calculations and updates results based on user inputs and filter changes.
- **Settings**: Updates max hours and graduation hours, ensuring data consistency.

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature-name`).
3. Make your changes and commit (`git commit -m "Add feature"`).
4. Push to the branch (`git push origin feature-name`).
5. Open a pull request on [GitHub](https://github.com/yaseen454/GPAFlow).

Report issues or suggest features via the GitHub Issues page.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.