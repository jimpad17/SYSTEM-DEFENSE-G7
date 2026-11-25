/* ============================================================
   Build the filled-in System Analysis & Design document (.docx)
   Project FleetForward — GreenLeaf Logistics
   Run: node scripts/build-doc.js
   ============================================================ */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow,
  TableCell, ImageRun, Footer, PageNumber, AlignmentType, WidthType,
  VerticalAlign, PageBreak, TableOfContents
} = require('docx');

const FONT = 'Calibri';
const NAVY = '10251C';
const GREEN = '16A34A';
const LIGHT = 'E9F8EE';

const P = (text, o = {}) => new Paragraph({
  children: [new TextRun({ text, font: FONT, size: o.size || 21, bold: !!o.bold, italics: !!o.italics, color: o.color || '16251D' })],
  spacing: { after: o.after === undefined ? 120 : o.after, before: o.before || 0 },
  alignment: o.align || AlignmentType.LEFT
});
const B = text => new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 80 }, style: 'ListParagraph' });
const H1 = text => new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 150 } });
const H2 = text => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 110 } });
const H3 = text => new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 90 } });
const NOTE = text => new Paragraph({ children: [new TextRun({ text, font: FONT, size: 19, italics: true, color: '64748B' })], spacing: { after: 140 } });

function cell(text, o = {}) {
  return new TableCell({
    width: o.width ? { size: o.width, type: WidthType.PERCENTAGE } : undefined,
    shading: o.fill ? { fill: o.fill } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 70, bottom: 70, left: 110, right: 110 },
    children: [new Paragraph({
      children: [new TextRun({ text: String(text), font: FONT, size: o.size || 19, bold: !!o.bold, color: o.color || (o.fill === NAVY ? 'FFFFFF' : '16251D') })],
      spacing: { after: 0 }
    })]
  });
}
function mkTable(headers, rows, widths) {
  const head = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => cell(h, { width: widths ? widths[i] : undefined, fill: NAVY, bold: true, size: 18 }))
  });
  const body = rows.map((r, ri) => new TableRow({
    children: r.map((v, i) => cell(v, { width: widths ? widths[i] : undefined, fill: ri % 2 ? 'F4F8F4' : undefined, size: 18 }))
  }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [head, ...body] });
}
function shot(file, caption, w = 560, h = 350) {
  const p = path.join(__dirname, '..', 'assets', 'screens', file);
  return [
    new Paragraph({ children: [new ImageRun({ type: 'png', data: fs.readFileSync(p), transformation: { width: w, height: h } })], alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 } }),
    new Paragraph({ children: [new TextRun({ text: caption, font: FONT, size: 18, italics: true, color: '64748B' })], alignment: AlignmentType.CENTER, spacing: { after: 180 } })
  ];
}

const children = [];
const add = (...items) => items.forEach(i => Array.isArray(i) ? children.push(...i) : children.push(i));

/* ---------------- Cover ---------------- */
add(
  new Paragraph({ children: [new TextRun({ text: 'PROJECT FLEETFORWARD', font: FONT, size: 60, bold: true, color: NAVY })], alignment: AlignmentType.CENTER, spacing: { before: 1300, after: 70 } }),
  new Paragraph({ children: [new TextRun({ text: 'Samsara Integration for GreenLeaf Logistics', font: FONT, size: 32, color: GREEN })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
  new Paragraph({ children: [new TextRun({ text: 'System Analysis and Design Document', font: FONT, size: 28, bold: true, color: NAVY })], alignment: AlignmentType.CENTER, spacing: { after: 500 } }),
  P('Submitted by:   [GROUP MEMBERS]', { align: AlignmentType.CENTER, size: 22 }),
  P('Program:            [COURSE / YEAR & SECTION]', { align: AlignmentType.CENTER, size: 22 }),
  P('Instructor:         [INSTRUCTOR NAME]', { align: AlignmentType.CENTER, size: 22 }),
  P('Institution:       [SCHOOL NAME]', { align: AlignmentType.CENTER, size: 22 }),
  P('Date:                  [DATE]', { align: AlignmentType.CENTER, size: 22 }),
  new Paragraph({ children: [new PageBreak()] })
);

/* ---------------- TOC ---------------- */
add(
  new Paragraph({ children: [new TextRun({ text: 'Table of Contents', font: FONT, size: 36, bold: true, color: NAVY })], spacing: { after: 200 } }),
  new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-2' }),
  NOTE('In Microsoft Word, right-click the table above and choose “Update Field” to refresh page numbers.'),
  new Paragraph({ children: [new PageBreak()] })
);

/* ---------------- 1. Introduction ---------------- */
add(H1('1. Introduction'));
add(H2('1.1. Project Overview'));
add(P('Project FleetForward is a fleet-management system selection and design project for GreenLeaf Logistics, a delivery company operating approximately 50 trucks. The study compares four candidate fleet platforms, recommends the Samsara Fleet Cloud Platform, and presents a working browser-based prototype that simulates the selected system. The prototype demonstrates the complete operational workflow: live vehicle tracking, AI-assisted route planning, driver scheduling and dispatch, fuel and idle monitoring, a driver mobile application, and fleet reporting. This document follows the System Development Life Cycle and presents the planning, analysis, design, implementation, and testing of the project.'));

add(H2('1.2. Background of the Study'));
add(P('GreenLeaf Logistics currently manages its fleet using paper logs and spreadsheets. Routes are prepared manually, driver schedules are maintained in separate files, and vehicle positions are confirmed by phone. As the fleet grew to around 50 trucks, these practices became unreliable. Management cannot see vehicles in real time, dispatchers cannot respond quickly to delays, and fuel expenses have risen by 20% due to inefficient routing and vehicle idling. With an annual technology budget of $125,000, the company is in a position to adopt a commercial fleet-management platform, but needs evidence to choose the right one.'));

add(H2('1.3. Problem Statement'));
add(P('The client faces four closely related problems:'));
add(
  B('No real-time visibility — paper logs cannot show where vehicles are at any given moment.'),
  B('Inefficient routing — manually planned routes increase distance, driving time, and fuel consumption.'),
  B('Manual scheduling and dispatch — assigning drivers and shifts requires repeated phone calls and spreadsheet edits.'),
  B('Unmeasured fuel waste — idling and fuel usage are not captured, so the 20% cost increase cannot be controlled.'),
  B('No consolidated reporting — management has no single source of fleet performance data.')
);

add(H2('1.4. Objectives of the Project'));
add(
  B('To assess the client’s current fleet operations and define measurable system requirements.'),
  B('To compare four candidate fleet-management platforms using a weighted decision matrix.'),
  B('To recommend the platform that best fits the requirements, deployment needs, and budget.'),
  B('To design and build a working prototype that demonstrates all seven client requirements.'),
  B('To evaluate cost, risks, and mitigation strategies for the recommended solution.')
);

add(H2('1.5. Scope and Delimitations'));
add(H3('Scope (In-Scope)'));
add(
  B('Client scenario analysis and requirement definition.'),
  B('Market scan of four fleet-management platforms and weighted selection.'),
  B('Three-year cost estimate against the $125,000 annual budget.'),
  B('Prototype modules: live GPS map, smart routes, dispatch, fuel and idle, driver app, and fleet reports.'),
  B('Risk assessment focused on driver adoption, with a mitigation plan.')
);
add(H3('Delimitations (Out-of-Scope)'));
add(
  B('Purchase and physical installation of OBD-II telematics hardware.'),
  B('A live paid Samsara account, API credentials, and real vehicle telematics feed.'),
  B('Integration with the client’s accounting or payroll systems.'),
  B('Development of a production mobile app for public app stores.'),
  B('Negotiation or signing of an actual vendor contract.')
);

add(H2('1.6. Significance of the Study'));
add(
  B('For GreenLeaf Logistics — a clear, evidence-based platform decision and a preview of the operational workflow.'),
  B('For dispatchers and drivers — fewer manual calls, clearer job assignments, and simpler check-in.'),
  B('For management — live fleet indicators, fuel-cost visibility, and exportable reports.'),
  B('For the developers — practical application of systems analysis, evaluation criteria, and prototype development.')
);

/* ---------------- 2. Planning ---------------- */
add(H1('2. System Planning'));
add(H2('2.1. Project Feasibility Study'));
add(H3('2.1.1. Technical Feasibility'));
add(P('The recommended platform, Samsara Fleet Cloud, is a mature cloud/SaaS product with live GPS, route optimization, a driver mobile app, and fuel/idle reporting — all available without custom hardware development. The prototype uses standard HTML, CSS, and JavaScript in a browser, requiring no installation or special equipment. The technical approach is therefore feasible.'));
add(H3('2.1.2. Economic Feasibility (Cost-Benefit Analysis)'));
add(mkTable(['Item', 'Estimated Cost', 'Benefit / Notes'], [
  ['Samsara Fleet Cloud (planning figure)', '$24,000 / year', 'About 19% of the $125,000 annual budget'],
  ['Three-year estimated cost', '$72,000', 'Well within the $375,000 three-year budget'],
  ['OBD-II hardware & installation', 'To be quoted', 'Required for live vehicle data in production'],
  ['Training and rollout', 'Internal effort', 'Addressed in the mitigation plan'],
  ['Fuel savings', 'Estimated ~$124,800 / year', 'Based on 29.9 L saved per cycle at $3.20/L, 260 days']
], [34, 26, 40]));
add(P('Conclusion: The project is economically viable. The estimated platform cost fits comfortably within the budget, and the projected fuel savings may allow the investment to pay for itself within the first year. All figures are planning estimates and require a formal vendor quotation.'));
add(H3('2.1.3. Operational Feasibility'));
add(P('The system directly addresses the client’s manual processes. The main operational risk is driver resistance to tracking and new technology. This is mitigated through hands-on training, transparent communication about data use, a pilot rollout, and incentives for fuel efficiency.'));
add(H3('2.1.4. Schedule Feasibility'));
add(P('The study and prototype can be completed within one academic term. The prototype is deliberately scoped to the seven client requirements so that every feature can be built and demonstrated within the available time.'));
add(H2('2.2. Project Schedule (Gantt Chart)'));
add(mkTable(['Phase / Activity', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'], [
  ['Planning and feasibility', 'X', 'X', '', '', '', '', '', ''],
  ['Client scenario & requirements', '', 'X', 'X', '', '', '', '', ''],
  ['Market scan and evaluation', '', '', 'X', 'X', '', '', '', ''],
  ['Cost analysis and recommendation', '', '', '', 'X', 'X', '', '', ''],
  ['Prototype implementation', '', '', '', '', 'X', 'X', 'X', ''],
  ['Testing and documentation', '', '', '', '', '', '', 'X', 'X'],
  ['Defense preparation', '', '', '', '', '', '', '', 'X']
], [32, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5]));
add(NOTE('X = scheduled active week. A detailed Gantt chart is also included in Appendix C.'));

/* ---------------- 3. Analysis ---------------- */
add(H1('3. System Analysis'));
add(H2('3.1. Requirement Gathering Methods'));
add(
  B('Interviews — discussions with the operations manager about fleet size, routing, and fuel costs.'),
  B('Observation — reviewing how dispatchers assign trucks and communicate with drivers.'),
  B('Document analysis — examining sample route sheets, driver schedules, and fuel summaries.'),
  B('Scenario study — using the provided client brief and budget constraint (see Appendix A).')
);
add(H2('3.2. Functional Requirements'));
add(mkTable(['ID', 'Functional Requirement'], [
  ['FR-01', 'The system shall display the real-time position and status of all 50 vehicles.'],
  ['FR-02', 'The system shall provide AI-assisted route planning with distance, ETA, and fuel-saving estimates.'],
  ['FR-03', 'The system shall support driver assignment, shift scheduling, and vehicle dispatch.'],
  ['FR-04', 'The system shall monitor fuel level and idle time and raise alerts for low fuel or excessive idling.'],
  ['FR-05', 'The system shall provide a driver-facing mobile view for jobs, navigation, and check-in.'],
  ['FR-06', 'The system shall generate fleet KPIs, charts, and alert history reports.'],
  ['FR-07', 'The system shall allow export of vehicle, route, and alert data to CSV.'],
  ['FR-08', 'The system shall allow new vehicles and drivers to be added quickly through cloud-based management.']
], [12, 88]));
add(H2('3.3. Non-Functional Requirements'));
add(mkTable(['ID', 'Category', 'Requirement'], [
  ['NFR-01', 'Performance', 'Map and dashboard screens shall refresh within three seconds on a standard computer.'],
  ['NFR-02', 'Usability', 'A dispatcher shall be able to dispatch a vehicle with minimal training.'],
  ['NFR-03', 'Reliability', 'The production platform shall provide cloud availability and data recovery.'],
  ['NFR-04', 'Security', 'Access shall be role-controlled; production data shall be encrypted in transit.'],
  ['NFR-05', 'Compatibility', 'The prototype shall run on current Chrome, Edge, and Firefox browsers.'],
  ['NFR-06', 'Scalability', 'The design shall support the current 50-vehicle fleet and future growth.']
], [12, 20, 68]));
add(H2('3.4. Current System Analysis'));
add(H3('3.4.1. Description of the Existing System'));
add(P('Routes and driver schedules are recorded in spreadsheets and printed logs. Dispatchers phone drivers to confirm availability and relay assignments. Vehicle positions are unknown between check-ins. Fuel consumption is reviewed only when invoices arrive, so excessive idling is discovered after the cost has been incurred.'));
add(H3('3.4.2. Limitations of the Existing System'));
add(
  B('No live vehicle location or status information.'),
  B('Manual routing cannot respond quickly to traffic or delays.'),
  B('Driver assignment is slow and error-prone.'),
  B('Fuel waste is invisible until the bill arrives.'),
  B('Reports are compiled manually and are not available on demand.')
);
add(H2('3.5. Proposed System Analysis'));
add(H3('3.5.1. Description of the Proposed System'));
add(P('The proposed system is the Samsara Fleet Cloud Platform, supported by OBD-II telematics hardware in production. It provides live GPS tracking, AI route planning, automated driver scheduling and dispatch, fuel and idle monitoring, a driver mobile application, and fleet reporting. The prototype simulates these capabilities in a browser using sample data for 50 vehicles, 30 drivers, and 8 routes, so the workflow can be demonstrated without hardware or a paid account.'));
add(H3('3.5.2. Benefits of the Proposed System'));
add(
  B('Immediate visibility of the whole fleet.'),
  B('Fuel savings through optimized routes and reduced idling.'),
  B('Faster dispatch and clearer driver responsibilities.'),
  B('Data-driven management reports and alerts.'),
  B('Cloud-based setup that scales with the business.')
);
add(H2('3.6. Analysis Models'));
add(H3('3.6.1. Use Case Diagram'));
add(P('Actors: Dispatcher, Driver, and Fleet Manager. The main use cases are: Track vehicles, Plan routes, Assign and dispatch drivers, Monitor fuel and idle time, Receive mobile jobs, and View reports. A graphical use case summary is presented in the defense slides.'));
add(mkTable(['Use Case', 'Actor', 'Brief Description'], [
  ['Track vehicles', 'Dispatcher / Manager', 'View live positions, statuses, and alerts for all vehicles.'],
  ['Plan routes', 'Dispatcher', 'Run AI optimization; compare distance, ETA, and fuel savings.'],
  ['Dispatch driver', 'Dispatcher', 'Assign a driver and route, then set the vehicle to On Route.']
], [22, 24, 54]));
add(H3('3.6.2. Data Flow Diagram (DFD)'));
add(P('Context Diagram (Level 0): The FleetForward system is a single process. The Dispatcher supplies assignments and receives vehicle status; the Driver receives jobs and submits check-ins and fuel logs; the Fleet Manager requests reports. The system returns live positions, optimized routes, alerts, and performance reports.'));
add(P('Level 1 DFD: Processes: 1.0 Track vehicles, 2.0 Optimize routes, 3.0 Manage dispatch, 4.0 Monitor fuel, and 5.0 Generate reports. Data stores: D1 Vehicles, D2 Drivers, D3 Routes, and D4 Alerts. Process 3.0 reads D2 and D3 and updates D1; process 4.0 writes to D4; process 5.0 reads D1–D4.'));
add(H3('3.6.3. Entity-Relationship Diagram (ERD)'));
add(P('Entities: DRIVERS, VEHICLES, ROUTES, and ALERTS. A driver may be assigned to one vehicle at a time (1:1); a vehicle follows one current route but a route may serve many vehicles over time (1:N); a vehicle can generate many alerts (1:N). In production these map to relational tables with foreign keys.'));

/* ---------------- 4. Design ---------------- */
add(H1('4. System Design'));
add(H2('4.1. Architectural Design'));
add(P('The prototype follows a three-tier architecture. The presentation tier contains six screens: Live GPS Map, Smart Routes, Dispatch & Drivers, Fuel & Idle, Driver App, and Fleet Reports. The logic tier runs the GPS movement engine, route optimizer, dispatch rules, alert rules, and CSV export. The data tier holds vehicles, drivers, routes, and alerts. In the prototype, the data tier is browser localStorage; in production it is the Samsara cloud platform with OBD-II devices in vehicles.'));
add(H2('4.2. Database Design (Schema)'));
add(mkTable(['Table / Field', 'Data Type', 'Constraints', 'Description'], [
  ['drivers.driver_id', 'VARCHAR / INT', 'PRIMARY KEY', 'Unique driver identifier'],
  ['drivers.name', 'VARCHAR(100)', 'NOT NULL', 'Driver full name'],
  ['drivers.license', 'VARCHAR(30)', 'NOT NULL', 'Driver license number'],
  ['drivers.shift', 'VARCHAR(30)', 'NOT NULL', 'Assigned work shift'],
  ['drivers.status', 'VARCHAR(20)', 'NOT NULL', 'On Duty, Off Duty, or On Leave'],
  ['vehicles.vehicle_id', 'VARCHAR / INT', 'PRIMARY KEY', 'Unique vehicle identifier'],
  ['vehicles.code', 'VARCHAR(20)', 'NOT NULL, UNIQUE', 'Fleet code (e.g., GL-101)'],
  ['vehicles.plate', 'VARCHAR(20)', 'NOT NULL', 'License plate'],
  ['vehicles.driver_id', 'FOREIGN KEY', 'REFERENCES drivers', 'Currently assigned driver'],
  ['vehicles.route_id', 'FOREIGN KEY', 'REFERENCES routes', 'Currently assigned route'],
  ['vehicles.status', 'VARCHAR(20)', 'NOT NULL', 'On Route, Idle, Maintenance, Off Duty'],
  ['vehicles.fuel_pct', 'INT', 'NOT NULL', 'Fuel level percentage'],
  ['vehicles.idle_min', 'INT', 'NOT NULL', 'Idle minutes recorded today'],
  ['routes.route_id', 'VARCHAR / INT', 'PRIMARY KEY', 'Unique route identifier'],
  ['routes.distance_km', 'DECIMAL(8,2)', 'NOT NULL', 'Planned route distance'],
  ['routes.eta_min', 'INT', 'NOT NULL', 'Estimated travel time'],
  ['routes.base_fuel_l', 'DECIMAL(8,2)', 'NOT NULL', 'Fuel before optimization'],
  ['routes.opt_fuel_l', 'DECIMAL(8,2)', 'NOT NULL', 'Fuel after optimization'],
  ['alerts.alert_id', 'VARCHAR / INT', 'PRIMARY KEY', 'Unique alert identifier'],
  ['alerts.vehicle_id', 'FOREIGN KEY', 'REFERENCES vehicles', 'Vehicle that raised the alert'],
  ['alerts.severity', 'VARCHAR(10)', 'NOT NULL', 'High, medium, or low'],
  ['alerts.message', 'VARCHAR(255)', 'NOT NULL', 'Alert description']
], [27, 18, 22, 33]));
add(H2('4.3. Interface Design (UI/UX)'));
add(H3('4.3.1. Input Design'));
add(P('Inputs are collected through forms and controls with clear labels: the map filter and vehicle search; driver and route dropdowns on the dispatch board; the optimize-routes button; the driver-app action buttons; and the report date range. Invalid or incomplete dispatch actions are rejected with an on-screen message.'));
add(H3('4.3.2. Output Design'));
add(P('Outputs include the live map with color-coded truck markers, KPI cards, alert feed, route cards with fuel-saving badges, dispatch and fuel tables, the mobile-style driver screen, charts, and CSV downloads. Estimated costs use US dollars as in the client brief.'));
add(H3('4.3.3. User Interface Mockups / Actual Screens'));
add(shot('01-live-map.png', 'Figure 1. Live GPS map with moving vehicle markers, KPIs, and alerts.'));
add(shot('03-routes-before.png', 'Figure 2. Smart route planning before optimization.'));
add(shot('09-routes-optimized.png', 'Figure 3. Route plan after optimization with fuel savings.'));
add(shot('04-dispatch.png', 'Figure 4. Dispatch board with driver and route assignments.'));
add(shot('08-driver-navigation.png', 'Figure 5. Driver mobile app navigation screen.'));
add(H2('4.4. Program / Module Design'));
add(mkTable(['Module', 'Main Functions', 'Key Logic'], [
  ['Live GPS Map', 'Markers, filters, details, alerts', 'Interpolate vehicle position along route by progress and speed'],
  ['Smart Routes', 'Optimize button, savings, KPIs', 'Compare base fuel to optimized fuel; aggregate yearly saving'],
  ['Dispatch & Drivers', 'Assign driver/route, dispatch, recall, auto-assign', 'Require driver and route before status becomes On Route'],
  ['Fuel & Idle', 'Idle ranking, fuel monitor, refuel', 'Flag vehicles below 30%; update fuel and idle on refuel'],
  ['Driver App', 'Accept job, navigation, check-in, fuel log', 'Actions update the shared vehicle record and alert feed'],
  ['Fleet Reports', 'KPIs, charts, alert history, CSV export', 'Aggregate fleet data; serialize selected fields to CSV']
], [22, 36, 42]));

/* ---------------- 5. Implementation & Testing ---------------- */
add(H1('5. Implementation & Testing Plan'));
add(H2('5.1. Coding / Development Environment'));
add(
  B('Programming languages: HTML5, CSS3, and JavaScript (ES6).'),
  B('Libraries: pptxgenjs and docx were used only to prepare the defense materials.'),
  B('Data storage: browser localStorage for the prototype; Samsara cloud in production.'),
  B('Tools: Visual Studio Code, Node.js, Microsoft Edge / Chrome.'),
  B('Version control: Git (recommended for the final project repository).')
);
add(H2('5.2. Testing Strategy'));
add(P('Testing covered four levels: unit checks of calculations such as fuel savings; integration checks that dispatch and driver actions update the map and reports; system checks of all six screens; and user acceptance through a guided walkthrough of the client workflow.'));
add(mkTable(['Test ID', 'Scenario', 'Expected Result', 'Status'], [
  ['TC-01', 'Open the app in a browser', 'All six modules load with sample data', 'Pass'],
  ['TC-02', 'Select a truck on the GPS map', 'Live telemetry detail is shown', 'Pass'],
  ['TC-03', 'Optimize all routes', 'Optimized status and savings appear', 'Pass'],
  ['TC-04', 'Dispatch an assigned vehicle', 'Status changes to On Route', 'Pass'],
  ['TC-05', 'Accept job in driver app', 'Navigation and check-in work', 'Pass'],
  ['TC-06', 'Export reports to CSV', 'File downloads with correct rows', 'Pass']
], [12, 34, 38, 16]));
add(H2('5.3. Conversion Plan (Deployment Strategy)'));
add(P('For production, a pilot conversion is recommended: equip a small group of trucks first, compare paper-based and system-based figures during the pilot, train drivers, and then roll out to the full fleet. Parallel operation for one billing cycle will confirm data accuracy before the manual logs are retired.'));
add(H2('5.4. User Training Plan'));
add(P('Training consists of an orientation on the Samsara dashboard, a hands-on driver app session, a dispatcher workshop on assignment and dispatch, and a one-page quick reference. The mitigation plan also proposes monthly incentives for top fuel-efficiency scores to encourage adoption.'));
add(H2('5.5. Maintenance Plan'));
add(
  B('Corrective — resolve reported issues in routing data, statuses, or reports.'),
  B('Adaptive — adjust to vendor updates, new devices, or browser changes.'),
  B('Perfective — add report filters, new alert rules, or additional depots.'),
  B('Preventive — verify backups, review alert accuracy, and monitor device connectivity.')
);

/* ---------------- 6. Conclusion ---------------- */
add(H1('6. Conclusion & Recommendations'));
add(P('GreenLeaf Logistics has a clear operational problem: manual fleet processes and unmeasured fuel waste are raising costs. The weighted comparison shows that the Samsara Fleet Cloud Platform is the strongest fit among the four candidates, scoring 8.85 out of 10. Its estimated cost of $24,000 per year uses about 19% of the client’s annual budget, while the projected route and idle savings may offset the investment within the first year.'));
add(P('The working FleetForward prototype demonstrates the client workflow end to end: live tracking, route optimization, dispatch, fuel monitoring, driver mobile actions, and reporting. All representative tests passed. The main risk is driver adoption, which is addressed through training, transparent communication, a pilot rollout, and efficiency incentives.'));
add(P('Recommendation: proceed with Samsara, subject to a formal vendor quotation and a pilot implementation before full fleet rollout.'));

/* ---------------- 7. Appendices ---------------- */
add(H1('7. Appendices'));
add(H2('Appendix A: Client Scenario Summary'));
add(mkTable(['Item', 'Detail'], [
  ['Company', 'GreenLeaf Logistics'],
  ['Fleet size', 'Approximately 50 delivery trucks'],
  ['Current tools', 'Paper logs and spreadsheets for routing and scheduling'],
  ['Main issue', 'Difficult vehicle monitoring and driver scheduling'],
  ['Cost signal', 'Fuel costs increased 20% due to inefficient routing and idling'],
  ['Budget', '$125,000 available annually'],
  ['Decision', 'Samsara Fleet Cloud Platform (recommended)']
], [30, 70]));
add(H2('Appendix B: Detailed Data Dictionary'));
add(mkTable(['Field', 'Type', 'Description'], [
  ['code', 'VARCHAR(20)', 'Short fleet identifier used on the map and in reports'],
  ['status', 'VARCHAR(20)', 'Current operational state of a vehicle'],
  ['fuel_pct', 'INT', 'Fuel level; below 30 triggers a low-fuel alert'],
  ['idle_min', 'INT', 'Idle minutes used for the idle ranking chart'],
  ['base_fuel_l', 'DECIMAL(8,2)', 'Fuel consumption under the current manual route'],
  ['opt_fuel_l', 'DECIMAL(8,2)', 'Projected fuel consumption after AI optimization'],
  ['severity', 'VARCHAR(10)', 'Alert priority: high, medium, or low']
], [26, 20, 54]));
add(H2('Appendix C: Project Schedule (Gantt Chart)'));
add(P('The eight-week schedule in Section 2.2 shows planning and requirements in Weeks 1–3, market scan and recommendation in Weeks 3–5, prototype implementation in Weeks 5–7, and testing and defense preparation in Weeks 7–8.'));
add(H2('Appendix D: Glossary of Terms'));
add(mkTable(['Term', 'Definition'], [
  ['DFD', 'Data Flow Diagram — shows how data moves through a system.'],
  ['ERD', 'Entity-Relationship Diagram — shows entities, attributes, and relationships.'],
  ['OBD-II', 'On-Board Diagnostics device that supplies vehicle telematics data.'],
  ['SaaS', 'Software as a Service — cloud-hosted software accessed over the internet.'],
  ['TCO', 'Total Cost of Ownership — all costs over the system lifetime.'],
  ['Telematics', 'Transmission of vehicle data such as location, speed, and fuel use.'],
  ['UAT', 'User Acceptance Testing — end-user confirmation that the system meets needs.']
], [24, 76]));

/* ---------------- Document ---------------- */
const doc = new Document({
  creator: 'FleetForward Team',
  title: 'Project FleetForward — System Analysis and Design Document',
  description: 'Filled-in SAD document for the GreenLeaf Logistics defense',
  styles: { default: { document: { run: { font: FONT, size: 21 } } } },
  sections: [{
    properties: { page: { margin: { top: 1100, right: 1100, bottom: 1100, left: 1100 } } },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [
            new TextRun({ text: 'Project FleetForward — System Analysis and Design Document     |     Page ', font: FONT, size: 17, color: '7B869E' }),
            new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 17, color: '7B869E' })
          ],
          alignment: AlignmentType.CENTER
        })]
      })
    },
    children
  }]
});

const out = path.join(__dirname, '..', 'FleetForward-SAD-Document.docx');
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(out, buf);
  console.log('Document saved:', out, '| bytes:', buf.length);
}).catch(e => { console.error(e); process.exit(1); });
