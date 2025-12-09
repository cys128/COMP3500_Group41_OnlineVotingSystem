
function syncDataSources() {
    const candidates = JSON.parse(localStorage.getItem("candidates") || "[]");
    const carts = JSON.parse(localStorage.getItem("carts") || "[]");

    if (candidates.length > 0 && 
        (carts.length === 0 || 
         JSON.stringify(candidates) !== JSON.stringify(carts))) {
        localStorage.setItem("carts", JSON.stringify(candidates));
        console.log("Data has been synchronized");
    }
}

$(document).ready(function() {
    checkAdminAccess();
    if (!checkAdminAccess()) {
        return;
    }
    
    $('#adminUsername').text('Administrator: ' + (sessionStorage.getItem('username') || 'Admin'));
    
    syncDataSources();
    
    initializeEventsData();
    
    loadDashboardStats();
    
    loadEventsToSelect();
    
    $('#eventForm').submit(createVotingEvent);
    $('#candidateForm').submit(addCandidate);
    
    loadCandidates();
    
    loadUsers();
    
    loadVoteRecords();
    
    setInterval(refreshMonitor, 30000);
    
    console.log('Administrator backend initialization complete');
});

function initializeEventsData() {
    if (!localStorage.getItem('votingEvents')) {
        localStorage.setItem('votingEvents', JSON.stringify([]));
    }
    if (!localStorage.getItem('currentActiveEvent')) {
        localStorage.setItem('currentActiveEvent', '');
    }
    console.log('Voting event data initialization complete');
}

function checkAdminAccess() {
    const isAdmin = sessionStorage.getItem('is_admin') === 'true';
    const currentUser = sessionStorage.getItem('username');

    if (!currentUser || !isAdmin) {
        alert('Please log in as an administrator.');
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

function showSection(sectionId) {
    $('.section').removeClass('active').hide();
    
    $('.menu-item').removeClass('active');
    $(`.menu-item:contains(${getSectionName(sectionId)})`).addClass('active');
    
    $('#' + sectionId).addClass('active').show();
    
    switch(sectionId) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'monitorVotes':
            loadRealTimeData();
            break;
        case 'viewResults':
            loadResultsEvents();
            break;
        case 'voteRecords':
            loadVoteRecords();
            break;
    }
}

function getSectionName(sectionId) {
    const sections = {
        'dashboard': 'Dashboard',
        'createEvent': 'Create a voting event',
        'manageCandidates': 'Management Candidate',
        'monitorVotes': 'Real-time monitoring',
        'viewResults': 'View results',
        'voteRecords': 'Voting records',
        'userManagement': 'User Management'
    };
    return sections[sectionId] || sectionId;
}

function loadDashboardStats() {
    const votingEvents = JSON.parse(localStorage.getItem('votingEvents') || '[]');
    const candidates = JSON.parse(localStorage.getItem('candidates') || JSON.stringify(voteList));
    const voteRecords = JSON.parse(localStorage.getItem('voteRecords') || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const activeEvents = votingEvents.filter(event => event.status === 'active').length;
    
    const totalVotes = candidates.reduce((sum, candidate) => sum + (candidate.vote || 0), 0);
    
    const today = new Date().toISOString().split('T')[0];
    const todayVotes = voteRecords.filter(record => {
        const recordDate = new Date(record.votedAt).toISOString().split('T')[0];
        return recordDate === today;
    }).length;
    
    $('#activeEvents').text(activeEvents);
    $('#totalVotes').text(totalVotes);
    $('#totalUsers').text(users.length);
    $('#todayVotes').text(todayVotes);
}

function loadEventsToSelect() {
    const events = JSON.parse(localStorage.getItem('votingEvents') || '[]');
    
    const eventSelect = $('#eventSelect');
    const monitorSelect = $('#monitorEventSelect');
    const resultsSelect = $('#resultsEventSelect');
    
    eventSelect.empty();
    monitorSelect.empty();
    resultsSelect.empty();
    
    eventSelect.append('<option value="">Choose voting event</option>');
    monitorSelect.append('<option value="">Choose voting event</option>');
    resultsSelect.append('<option value="">Choose voting event</option>');
    
    events.forEach(event => {
        const option = `<option value="${event.id}">${event.title}</option>`;
        eventSelect.append(option);
        monitorSelect.append(option);
        resultsSelect.append(option);
    });
}

function createVotingEvent(e) {
    e.preventDefault();
    
    const eventId = Date.now();
    
    const startTime = new Date($('#startTime').val());
    const endTime = new Date($('#endTime').val());
    const now = new Date();
    
    if (startTime >= endTime) {
        showNotification('The end time must be later than the start time.', 'error');
        return;
    }
    
    if (endTime <= now) {
        showNotification('The end time must be later than the current time.', 'error');
        return;
    }
    
    const eventData = {
        id: eventId,
        title: $('#eventTitle').val(),
        description: $('#eventDescription').val(),
        startTime: $('#startTime').val(),
        endTime: $('#endTime').val(),
        status: 'active',
        createdBy: sessionStorage.getItem('username'),
        createdAt: new Date().toISOString(),
        candidateIds: [],
        isActive: true
    };
    
    if (!eventData.title || !eventData.startTime || !eventData.endTime) {
        showNotification('Please fill in all required fields', 'warning');
        return;
    }
    
    let events = JSON.parse(localStorage.getItem('votingEvents') || '[]');
    
    const existingEvent = events.find(e => e.title === eventData.title);
    if (existingEvent) {
        showNotification('A voting event with the same name already exists; please use a different title.', 'warning');
        return;
    }

    events.push(eventData);
    localStorage.setItem('votingEvents', JSON.stringify(events));
    
    localStorage.setItem('currentActiveEvent', eventId.toString());
    
    showNotification(`Voting event "${eventData.title}" Creation successful! You can now add candidates.`, 'success');

    $('#eventForm')[0].reset();

    loadEventsToSelect();
    loadEventsList();
    loadDashboardStats();

    showSection('manageCandidates');

    console.log('Create a new voting event:', eventData);
}

function addCandidate(e) {
    e.preventDefault();
    
    const candidateData = {
        id: Date.now(),
        name: $('#candidateName').val(),
        college: $('#candidateCollege').val(),
        description: $('#candidateDescription').val(),
        vote: 0,
        eventId: $('#eventSelect').val()
    };
    
    if (!candidateData.name || !candidateData.college || !candidateData.eventId) {
        alert('Please fill in all required fields.');
        return;
    }
    
    let candidates = JSON.parse(localStorage.getItem("candidates") || "[]");
    
    const existingCandidate = candidates.find(c => 
        c.name === candidateData.name && c.eventId == candidateData.eventId
    );
    if (existingCandidate) {
        alert('There is already a candidate with the same name in this event.');
        return;
    }

    candidates.push(candidateData);

    localStorage.setItem("candidates", JSON.stringify(candidates));
    localStorage.setItem("carts", JSON.stringify(candidates));

    let events = JSON.parse(localStorage.getItem('votingEvents') || '[]');
    const eventIndex = events.findIndex(e => e.id == candidateData.eventId);
    if (eventIndex !== -1) {
        if (!events[eventIndex].candidateIds) {
            events[eventIndex].candidateIds = [];
        }
        events[eventIndex].candidateIds.push(candidateData.id);
        localStorage.setItem('votingEvents', JSON.stringify(events));
    }

    showNotification('Candidate added successfully!');

    $('#candidateForm')[0].reset();

    loadCandidates();

    loadDashboardStats();
}

function loadCandidates() {
    const container = $("#candidatesContainer");

    container.html('<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading candidate data...</div>');

    container.empty();
    
    if (candidates.length === 0) {
        container.html(`
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                <i class="fas fa-users" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
                <h3 style="color: #666; margin-bottom: 10px;">No candidates yet</h3>
                <p style="color: #999;">Please wait for the administrator to add candidates.</p>
            </div>
        `);
        return;
    }

    const currentEventId = localStorage.getItem('currentActiveEvent');
    if (!currentEventId) {
        container.html(`
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                <i class="fas fa-calendar-times" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
                <h3 style="color: #666; margin-bottom: 10px;">There are currently no active voting activities.</h3>
                <p style="color: #999;">Please wait for the administrator to create the voting activity.</p>
            </div>
        `);
        return;
    }
    
    const events = JSON.parse(localStorage.getItem('votingEvents') || '[]');
    const currentEvent = events.find(e => e.id == currentEventId);
    
    if (!currentEvent) {
        container.html(`
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                <i class="fas fa-calendar-times" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
                <h3 style="color: #666; margin-bottom: 10px;">The voting activity does not exist</h3>
                <p style="color: #999;">Please refresh the page or contact the administrator.</p>
            </div>
        `);
        return;
    }
    
    updateEventInfo(currentEvent);

    let candidates = JSON.parse(localStorage.getItem("candidates") || "[]");
    
    const eventCandidates = candidates.filter(c => c.eventId == currentEventId);
    
    container.empty();
    
    if (eventCandidates.length === 0) {
        container.html(`
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                <i class="fas fa-users" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
                <h3 style="color: #666; margin-bottom: 10px;">No candidates yet</h3>
                <p style="color: #999;">Please wait for the administrator to add candidates.</p>
            </div>
        `);
        return;
    }
    
    const totalVotes = eventCandidates.reduce((sum, candidate) => sum + (candidate.vote || 0), 0);
    
    eventCandidates.forEach((candidate, index) => {
        const voteCount = candidate.vote || 0;
        const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;
        
        const card = `
            <div class="candidate-card">
                <div class="candidate-content">
                    <div class="candidate-header">
                        <div class="candidate-avatar">
                            <i class="fas fa-user-graduate"></i>
                        </div>
                        <div>
                            <h3 class="candidate-name">${candidate.name}</h3>
                            <p class="candidate-college">
                                <i class="fas fa-university"></i> ${candidate.college}
                            </p>
                        </div>
                    </div>
                    
                    <div class="vote-progress">
                        <div class="vote-label">
                            <span>Current vote count: ${voteCount}</span>
                            <span>${percentage}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                    
                    <button class="vote-button" onclick="voteForCandidate(${candidate.id})" 
                            data-candidate-id="${candidate.id}">
                        <i class="fas fa-vote-yea"></i> vote in support
                    </button>
                </div>
            </div>
        `;
        
        container.append(card);
    });

    $("#totalCandidates").text(eventCandidates.length);
}

function editCandidate(id) {
    const candidates = JSON.parse(localStorage.getItem('candidates') || JSON.stringify(voteList));
    const candidate = candidates.find(c => c.id == id);
    
    if (!candidate) {
        alert('Cannot find candidates');
        return;
    }

    $('#candidateName').val(candidate.name);
    $('#candidateCollege').val(candidate.college);
    $('#candidateImage').val(candidate.image);
    $('#candidateDescription').val(candidate.description);
    $('#eventSelect').val(candidate.eventId);

    $('#candidateForm').off('submit').submit(function(e) {
        e.preventDefault();
        updateCandidate(id);
    });

    $('#candidateForm button[type="submit"]').text('Update Candidates');
    
    showNotification('Editing candidate: ' + candidate.name);
}

function updateCandidate(id) {
    const candidateData = {
        id: id,
        name: $('#candidateName').val(),
        college: $('#candidateCollege').val(),
        description: $('#candidateDescription').val()
    };

    if (!candidateData.name || !candidateData.college) {
        alert('Please fill in all required fields.');
        return;
    }
    
    let candidates = JSON.parse(localStorage.getItem("candidates") || "[]");
    
    const index = candidates.findIndex(c => c.id == id);
    if (index !== -1) {
        candidateData.vote = candidates[index].vote || 0;
        candidates[index] = candidateData;

        localStorage.setItem("candidates", JSON.stringify(candidates));
        localStorage.setItem("carts", JSON.stringify(candidates));
        
        showNotification('Candidate update successful!');
        
        $('#candidateForm')[0].reset();

        $('#candidateForm').off('submit').submit(addCandidate);
        $('#candidateForm button[type="submit"]').text('添加候选人');

        loadCandidates();
    }
}

function deleteCandidate(id) {
    if (!confirm('Are you sure you want to delete this candidate?')) return;
    
    let candidates = JSON.parse(localStorage.getItem("candidates") || "[]");

    candidates = candidates.filter(c => c.id != id);
    
    localStorage.setItem("candidates", JSON.stringify(candidates));
    localStorage.setItem("carts", JSON.stringify(candidates));
    
    loadCandidates();
    showNotification('Candidate successfully deleted!');

    loadDashboardStats();
}

function updateEventInfo(event) {
    $(".app-title p").text(event.title);
    
    $("#voteStartTime").text(formatDate(event.startTime));
    $("#voteEndTime").text(formatDate(event.endTime));
    
    const now = new Date();
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    
    if (now < startTime) {
        $("#voteStatus").text("Not started").css("color", "#ff9800");
    } else if (now > endTime) {
        $("#voteStatus").text("Ended").css("color", "#f44336");
    } else {
        $("#voteStatus").text("In progress").css("color", "#4caf50");
    }
    
    // 计算剩余天数
    const remainingDays = Math.ceil((endTime - now) / (1000 * 60 * 60 * 24));
    if (remainingDays > 0) {
        $("#remainingDays").text(remainingDays + "day");
    } else if (remainingDays === 0) {
        $("#remainingDays").text("Last day");
    } else {
        $("#remainingDays").text("Ended");
    }
}

function formatDate(dateString) {
    if (!dateString) return 'unknown';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function loadRealTimeData() {
    const candidates = JSON.parse(localStorage.getItem("candidates") || "[]");
    const voteRecords = JSON.parse(localStorage.getItem('voteRecords') || '[]');
    
    const totalVotes = candidates.reduce((sum, candidate) => sum + (candidate.vote || 0), 0);
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentVotes = voteRecords.filter(record => new Date(record.votedAt) > oneHourAgo);
    const voteRate = recentVotes.length;
    
    $('#realTimeTotalVotes').text(totalVotes);
    $('#voteRate').text(voteRate);
    
    loadRecentVotes();
    
    drawVotesChart();
}

function loadRecentVotes() {
    const voteRecords = JSON.parse(localStorage.getItem('voteRecords') || '[]');
    const candidates = JSON.parse(localStorage.getItem('candidates') || JSON.stringify(voteList));
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const recentVotes = voteRecords
        .sort((a, b) => new Date(b.votedAt) - new Date(a.votedAt))
        .slice(0, 10);
    
    const tbody = $('#recentVotesTable tbody');
    tbody.empty();
    
    if (recentVotes.length === 0) {
        tbody.append('<tr><td colspan="5">No voting records yet</td></tr>');
        return;
    }
    
    recentVotes.forEach(vote => {
        const candidate = candidates.find(c => c.id == vote.candidateId) || {name: 'unknown'};

        const time = new Date(vote.votedAt).toLocaleTimeString();
        
        const row = `
            <tr>
                <td>${time}</td>
                <td>${vote.username || 'Anonymous user'}</td>
                <td>${candidate.name}</td>
                <td>${vote.ip || 'unknown'}</td>
                <td>${vote.voteId || ''}</td>
            </tr>
        `;
        tbody.append(row);
    });
}

function drawVotesChart() {
    const ctx = document.getElementById('votesChart');
    if (!ctx) return;
    
    const candidates = JSON.parse(localStorage.getItem("candidates") || "[]");
    
    const topCandidates = [...candidates]
        .sort((a, b) => (b.vote || 0) - (a.vote || 0))
        .slice(0, 8);
    
    const labels = topCandidates.map(c => c.name);
    const data = topCandidates.map(c => c.vote || 0);
    
    if (window.votesChartInstance) {
        window.votesChartInstance.destroy();
    }

    window.votesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Votes',
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Candidates vote rankings (top 8)'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Votes'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'candidate'
                    }
                }
            }
        }
    });
}

function refreshMonitor() {
    loadRealTimeData();
    showNotification('监The monitoring data has been updated.控数据已刷新');
}

function loadResultsEvents() {
    const events = JSON.parse(localStorage.getItem('votingEvents') || '[]');
    
    const select = $('#resultsEventSelect');
    select.empty();
    select.append('<option value="">Choose voting event</option>');
    
    events.forEach(event => {
        select.append(`<option value="${event.id}">${event.title}</option>`);
    });
}

function loadEventResults(eventId) {
    if (!eventId) return;
    
    const events = JSON.parse(localStorage.getItem('votingEvents') || '[]');
    const candidates = JSON.parse(localStorage.getItem('candidates') || JSON.stringify(voteList));
    
    const event = events.find(e => e.id == eventId);
    if (!event) return;
    
    const eventCandidates = candidates.filter(c => c.eventId == eventId);
    
    const totalVotes = eventCandidates.reduce((sum, c) => sum + (c.vote || 0), 0);

    const sortedCandidates = [...eventCandidates].sort((a, b) => (b.vote || 0) - (a.vote || 0));
    
    let resultsHTML = `
        <h3>${event.title} - Voting Results</h3>
        <div class="results-summary">
            <p>Voting time: ${event.startTime} to ${event.endTime}</p>
            <p>Total votes: <strong>${totalVotes}</strong></p>
            <p>Number of candidates: <strong>${sortedCandidates.length}</strong></p>
            <p>Status: <span class="status-${event.status}">${getStatusText(event.status)}</span></p>
        </div>
        <table class="detailed-results">
            <thead>
                <tr>
                    <th>Ranking</th>
                    <th>candidate</th>
                    <th>College</th>
                    <th>Votes</th>
                    <th>percentage</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    sortedCandidates.forEach((candidate, index) => {
        const percentage = totalVotes > 0 ? ((candidate.vote || 0) / totalVotes * 100).toFixed(1) : 0;
        resultsHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${candidate.name}</td>
                <td>${candidate.college}</td>
                <td>${candidate.vote || 0}</td>
                <td>${percentage}%</td>
            </tr>
        `;
    });
    
    resultsHTML += `
            </tbody>
        </table>
    `;
    
    $('#resultsContainer').html(resultsHTML);
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Not started',
        'active': 'In progress',
        'ended': 'Ended'
    };
    return statusMap[status] || status;
}

function exportResults() {
    const eventId = $('#resultsEventSelect').val();
    if (!eventId) {
        alert('Please select the voting event first.');
        return;
    }
    
    const events = JSON.parse(localStorage.getItem('votingEvents') || '[]');
    const candidates = JSON.parse(localStorage.getItem('candidates') || JSON.stringify(voteList));
    
    const event = events.find(e => e.id == eventId);
    const eventCandidates = candidates.filter(c => c.eventId == eventId);
    
    let csv = 'Rank, Name, College, Number of Votes, Percentage\n';

    const totalVotes = eventCandidates.reduce((sum, c) => sum + (c.vote || 0), 0);

    const sortedCandidates = [...eventCandidates].sort((a, b) => (b.vote || 0) - (a.vote || 0));
    
    sortedCandidates.forEach((candidate, index) => {
        const percentage = totalVotes > 0 ? ((candidate.vote || 0) / totalVotes * 100).toFixed(2) : 0;
        csv += `${index + 1},${candidate.name},${candidate.college},${candidate.vote || 0},${percentage}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Voting Results_${event.title}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('The results have been exported as a CSV file.');
}

function publishResults() {
    const eventId = $('#resultsEventSelect').val();
    if (!eventId) {
        alert('Please select the voting event first.');
        return;
    }
    
    if (!confirm('Are you sure you want to publish the voting results? Once published, they cannot be modified.')) {
        return;
    }
    
    const events = JSON.parse(localStorage.getItem('votingEvents') || '[]');
    const eventIndex = events.findIndex(e => e.id == eventId);
    
    if (eventIndex !== -1) {
        events[eventIndex].status = 'ended';
        events[eventIndex].publishedAt = new Date().toISOString();
        localStorage.setItem('votingEvents', JSON.stringify(events));
        
        showNotification('The voting results have been successfully released!');

        loadEventResults(eventId);
    }
}

function loadUsers() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const tbody = $('#usersTable tbody');
    tbody.empty();
    
    if (users.length === 0) {
        tbody.append('<tr><td colspan="8">No users yet</td></tr>');
        return;
    }
    
    users.forEach(user => {
        const row = `
            <tr>
                <td>${user.id || 'N/A'}</td>
                <td>${user.username}</td>
                <td>${user.email || 'Not set'}</td>
                <td>${formatDate(user.createdAt)}</td>
                <td>${user.voteCount || 0}</td>
                <td>${user.lastVoteDate || 'No vote'}</td>
                <td>${user.isAdmin ? 'Yes' : 'No'}</td>
                <td>
                    ${!user.isAdmin ? `
                        <button onclick="resetUserVotes('${user.username}')" class="btn-reset">Reset voting</button>
                    ` : ''}
                </td>
            </tr>
        `;
        tbody.append(row);
    });
}

function formatDate(dateString) {
    if (!dateString) return 'Unkonwn';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function resetUserVotes(username) {
    if (!confirm(`Are you sure you want to reset user "${username}'s voting history?？`)) {
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex !== -1) {
        users[userIndex].voteCount = 0;
        users[userIndex].lastVoteDate = null;
        localStorage.setItem('users', JSON.stringify(users));

        if (sessionStorage.getItem('username') === username) {
            sessionStorage.setItem('vote', 10);
        }
        
        showNotification('User voting records have been reset.');

        loadUsers();
    }
}

function loadVoteRecords() {
    const voteRecords = JSON.parse(localStorage.getItem('voteRecords') || '[]');
    const candidates = JSON.parse(localStorage.getItem('candidates') || JSON.stringify(voteList));
    
    const tbody = $('#allVotesTable tbody');
    tbody.empty();
    
    if (voteRecords.length === 0) {
        tbody.append('<tr><td colspan="6">No voting records yet</td></tr>');
        return;
    }

    const sortedRecords = [...voteRecords].sort((a, b) => new Date(b.votedAt) - new Date(a.votedAt));
    
    sortedRecords.forEach(record => {
        const candidate = candidates.find(c => c.id == record.candidateId) || {name: '未知'};
        
        const date = new Date(record.votedAt);
        const timeString = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        const row = `
            <tr>
                <td>${record.id || 'N/A'}</td>
                <td>${record.username || 'Anonymous user'}</td>
                <td>${candidate.name}</td>
                <td>${timeString}</td>
                <td>${record.ip || 'Unknown'}</td>
                <td>${record.eventId || 'N/A'}</td>
            </tr>
        `;
        tbody.append(row);
    });
}

let currentDeleteEventId = null;
function loadEventsList() {
    const events = JSON.parse(localStorage.getItem('votingEvents') || '[]');
    const candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
    
    const tbody = $('#eventsTable tbody');
    const noEventsMessage = $('#noEventsMessage');
    
    tbody.empty();
    
    if (events.length === 0) {
        tbody.hide();
        if (noEventsMessage.length > 0) {
            noEventsMessage.show();
        }
        return;
    }
    
    if (noEventsMessage.length > 0) {
        noEventsMessage.hide();
    }
    tbody.show();

    events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    events.forEach(event => {
        const eventCandidates = candidates.filter(c => c.eventId == event.id);
        const candidateCount = eventCandidates.length;
        
        const totalVotes = eventCandidates.reduce((sum, candidate) => sum + (candidate.vote || 0), 0);
        
        const formatDate = (dateString) => {
            if (!dateString) return 'Not set';
            try {
                const date = new Date(dateString);
                return date.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (e) {
                return dateString;
            }
        };
        
        let statusText = event.status || 'Not set';
        let statusClass = 'status-' + statusText;
        
        const now = new Date();
        const startTime = new Date(event.startTime);
        const endTime = new Date(event.endTime);
        
        if (now < startTime) {
            statusText = 'Not started';
            statusClass = 'status-pending';
        } else if (now > endTime) {
            statusText = 'Ended';
            statusClass = 'status-ended';
        } else {
            statusText = 'In progress';
            statusClass = 'status-active';
        }
        
        const currentActiveEventId = localStorage.getItem('currentActiveEvent');
        const isActiveEvent = currentActiveEventId == event.id;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${event.id}</td>
            <td>
                <strong>${event.title}</strong>
                ${isActiveEvent ? '<br><small style="color: #4a00e0;">(当前活跃事件)</small>' : ''}
            </td>
            <td>${formatDate(event.startTime)}</td>
            <td>${formatDate(event.endTime)}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>${candidateCount}</td>
            <td>${totalVotes}</td>
            <td>${formatDate(event.createdAt)}</td>
            <td>
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    <button class="btn-activate" onclick="activateEventById(${event.id})" ${isActiveEvent ? 'disabled' : ''}>
                        ${isActiveEvent ? 'Activated' : 'Set as active'}
                    </button>
                    <button class="btn-delete-event" onclick="deleteEventById(${event.id}, '${event.title.replace(/'/g, "\\'")}')">
                        delete
                    </button>
                </div>
            </td>
        `;
        
        tbody.append(row);
    });
}

function activateEvent(eventId) {
    console.log('Activation event:', eventId);
    
    const events = JSON.parse(localStorage.getItem('votingEvents') || '[]');
    const event = events.find(e => e.id == eventId);
    
    if (!event) {
        showNotification('No voting event found', 'error');
        return;
    }

    const now = new Date();
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    
    if (now < startTime) {
        if (!confirm('The event has not started yet. Are you sure you want to set it as an active event?')) {
            return;
        }
    } else if (now > endTime) {
        if (!confirm('The event has ended. Are you sure you want to set it as an active event?')) {
            return;
        }
    }
    
    localStorage.setItem('currentActiveEvent', eventId.toString());
    showNotification(`Activated events: ${event.title}`, 'success');
    
    loadEventsList();

    if (typeof loadDashboardStats === 'function') {
        loadDashboardStats();
    }
}

function viewEventCandidates(eventId) {
    console.log('View event candidates:', eventId);

    sessionStorage.setItem('viewingEventId', eventId.toString());

    showSection('manageCandidates');

    filterCandidatesByEvent(eventId);
    
    showNotification('Candidates for the event have been filtered and displayed.');
}

function filterCandidatesByEvent(eventId) {
    const events = JSON.parse(localStorage.getItem('votingEvents') || '[]');
    const event = events.find(e => e.id == eventId);
    
    if (!event) return;

    $('#eventSelect').val(eventId);

    loadCandidates();

    $('.candidates-list h3').text(`Candidate List - ${event.title}`);
}

function showDeleteEventModal(eventId) {
    console.log('Display the delete modal, event ID:', eventId);
    
    currentDeleteEventId = eventId;
    
    const events = JSON.parse(localStorage.getItem('votingEvents') || '[]');
    const event = events.find(e => e.id == eventId);
    
    if (!event) {
        showNotification('No voting event found', 'error');
        return;
    }
    
    const candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
    const voteRecords = JSON.parse(localStorage.getItem('voteRecords') || '[]');
    
    const eventCandidates = candidates.filter(c => c.eventId == event.id);
    const candidateCount = eventCandidates.length;
    const voteRecordCount = voteRecords.filter(r => r.eventId == event.id).length;
    const isActiveEvent = localStorage.getItem('currentActiveEvent') == event.id;
    
    $('#deleteEventTitle').text(event.title);
    $('#deleteEventStats').text(`The event contains ${candidateCount} candidates and ${voteRecordCount} vote records.`);
    
    if (isActiveEvent) {
        $('#deleteEventActiveWarning').show();
    } else {
        $('#deleteEventActiveWarning').hide();
    }
    
    $('#deleteOption1').prop('checked', true);
    
    $('#deleteEventModal').fadeIn(200);
    console.log('The modal frame has been displayed.');
}

function closeDeleteEventModal() {
    console.log('Close the delete modal');
    $('#deleteEventModal').fadeOut(200);
    currentDeleteEventId = null;
}

function deleteEvent() {
    if (!currentDeleteEventId) {
        showNotification('Please select the event you want to delete first.', 'warning');
        return;
    }
    
    console.log('Execute deletion, event ID:', currentDeleteEventId);
    
    const events = JSON.parse(localStorage.getItem('votingEvents') || '[]');
    const eventIndex = events.findIndex(e => e.id == currentDeleteEventId);
    
    if (eventIndex === -1) {
        showNotification('No event to be deleted found.', 'error');
        closeDeleteEventModal();
        return;
    }
    
    const event = events[eventIndex];
    const deleteOption = $('input[name="deleteOption"]:checked').val();
    
    console.log('Delete option:', deleteOption);

    if (deleteOption === 'eventWithCandidates' || deleteOption === 'eventWithAllData') {
        let candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
        candidates = candidates.filter(c => c.eventId != currentDeleteEventId);
        localStorage.setItem('candidates', JSON.stringify(candidates));
        
        localStorage.setItem('carts', JSON.stringify(candidates));
        console.log('Associated candidates have been deleted');
    }
    
    if (deleteOption === 'eventWithAllData') {
        let voteRecords = JSON.parse(localStorage.getItem('voteRecords') || '[]');
        voteRecords = voteRecords.filter(r => r.eventId != currentDeleteEventId);
        localStorage.setItem('voteRecords', JSON.stringify(voteRecords));
        console.log('Related voting records have been deleted');
    }

    events.splice(eventIndex, 1);
    localStorage.setItem('votingEvents', JSON.stringify(events));
    console.log('Removed from the event list');
    
    if (localStorage.getItem('currentActiveEvent') == currentDeleteEventId) {
        localStorage.removeItem('currentActiveEvent');
        
        if (events.length > 0) {
            localStorage.setItem('currentActiveEvent', events[0].id.toString());
            showNotification(`"${events[0].title}" has been automatically set as the new active event.`, 'info');
        } else {
            showNotification('The last voting event has been deleted. Please create a new event.', 'warning');
        }
    }

    closeDeleteEventModal();

    showNotification(`The voting event "${event.title}" has been deleted.`, 'success');

    loadEventsList();

    if (typeof loadDashboardStats === 'function') {
        loadDashboardStats();
    }
    
    if (typeof loadEventsToSelect === 'function') {
        loadEventsToSelect();
    }
    
    if (typeof loadCandidates === 'function') {
        loadCandidates();
    }
}

$(document).keydown(function(e) {
    if (e.keyCode === 27) {
        closeDeleteEventModal();
    }
});

$(document).on('click', function(e) {
    if ($(e.target).hasClass('confirm-delete-modal')) {
        closeDeleteEventModal();
    }
});

function showSection(sectionId) {
    $('.section').removeClass('active').hide();

    $('.menu-item').removeClass('active');

    const menuItem = $(`.menu-item a:contains('${getSectionName(sectionId)}')`).parent();
    if (menuItem.length) {
        menuItem.addClass('active');
    }

    $('#' + sectionId).addClass('active').show();

    switch(sectionId) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'manageEvents':
            loadEventsList();
            break;
        case 'manageCandidates':
            const viewingEventId = sessionStorage.getItem('viewingEventId');
            if (viewingEventId) {
                filterCandidatesByEvent(viewingEventId);
                sessionStorage.removeItem('viewingEventId');
            } else {
                loadCandidates();
            }
            break;
        case 'monitorVotes':
            loadRealTimeData();
            break;
        case 'viewResults':
            loadResultsEvents();
            break;
        case 'voteRecords':
            loadVoteRecords();
            break;
        case 'userManagement':
            loadUsers();
            break;
    }
}

function getSectionName(sectionId) {
    const sections = {
        'dashboard': 'Dashboard',
        'createEvent': 'Create a voting event',
        'manageEvents': 'Managing voting events',
        'manageCandidates': 'Management Candidate',
        'monitorVotes': 'Real-time monitoring',
        'viewResults': 'View results',
        'voteRecords': 'Voting records',
        'userManagement': 'User Management'
    };
    return sections[sectionId] || sectionId;
}

function debugShowEvents() {
    console.group('=== Debugging: Voting event data ===');
    
    const events = JSON.parse(localStorage.getItem('votingEvents') || '[]');
    console.log('Number of events:', events.length);
    
    events.forEach(event => {
        console.log(`Event ID: ${event.id}, Title: "${event.title}"`);
    });
    
    console.log('Current active event ID:', localStorage.getItem('currentActiveEvent'));

    const candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
    console.log('Number of candidates:', candidates.length);
    
    candidates.forEach(candidate => {
        console.log(`candidate: ${candidate.name}, Event ID: ${candidate.eventId}, Votes: ${candidate.vote || 0}`);
    });
    
    console.groupEnd();
}

function debugTestDelete(eventId) {
    console.log('=== Test delete function ===');
    console.log('Test delete event ID:', eventId);

    const events = JSON.parse(localStorage.getItem('votingEvents') || '[]');
    const eventExists = events.some(e => e.id == eventId);
    console.log('Does the event exist?', eventExists);
    
    if (eventExists) {
        const event = events.find(e => e.id == eventId);
        console.log('Events to be deleted:', event);

        const candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
        const eventCandidates = candidates.filter(c => c.eventId == eventId);
        console.log('Number of associated candidates:', eventCandidates.length);
        
        showDeleteEventModal(eventId);
    } else {
        console.log('The event does not exist, deletion cannot be tested.');
    }
}

window.debugShowEvents = debugShowEvents;
window.debugTestDelete = debugTestDelete;

function showNotification(message) {
    const notification = $('<div class="notification">')
        .text(message)
        .css({
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            background: '#4a00e0',
            color: 'white',
            borderRadius: '5px',
            zIndex: '1000',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        });
    
    $('body').append(notification);

    setTimeout(() => {
        notification.fadeOut(500, () => notification.remove());
    }, 3000);
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}

function clearAllData() {
    if (confirm('Are you sure you want to clear all election data? This action is irreversible!')) {

        localStorage.setItem('candidates', JSON.stringify([]));
        localStorage.setItem('carts', JSON.stringify([]));
        localStorage.setItem('votingEvents', JSON.stringify([]));
        localStorage.setItem('voteRecords', JSON.stringify([]));
        
        loadDashboardStats();
        loadEventsList();
        loadCandidates();
        
        showNotification('All election data has been cleared.', 'success');
    }
}