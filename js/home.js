$(document).ready(function() {
    initializePage();
    
    loadCandidates();
    
    updateStats();
    
    checkLoginStatus();
    
    setInterval(updateStats, 30000);
    
    calculateRemainingDays();
});

function initializePage() {
    checkVoteStatus();
    
    updateUserInterface();
}

function checkLoginStatus() {
    const username = sessionStorage.getItem("username");
    const userActions = $("#userActions");
    const usernameDisplay = $("#usernameDisplay");
    const adminLink = $("#adminLink");
    
    if (username) {
        usernameDisplay.text("Welcome， " + username);
        
        const remainingVotes = sessionStorage.getItem("vote") || 10;
        $("#floatingVoteCount").text(remainingVotes);
        
        userActions.html(`
            <button class="action-btn" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> Log out
            </button>
        `);
        
        const isAdmin = sessionStorage.getItem("is_admin") === "true";
        if (isAdmin) {
            adminLink.show();
        }
    } else {
        usernameDisplay.html('<i class="fas fa-user"></i> Please log in');
        userActions.html(`
            <a href="login.html" class="action-btn">
                <i class="fas fa-sign-in-alt"></i> Log in
            </a>
            <a href="register.html" class="action-btn secondary">
                <i class="fas fa-user-plus"></i> Register
            </a>
        `);
        $("#floatingVoteCount").text("0");
    }
}

function checkVoteStatus() {
    const now = new Date();
    const startTime = new Date("2024-01-15T09:00:00");
    const endTime = new Date("2024-01-30T18:00:00");
    const voteStatus = $("#voteStatus");
    
    if (now < startTime) {
        voteStatus.text("Not started").css("color", "#ff9800");
    } else if (now > endTime) {
        voteStatus.text("Ended").css("color", "#f44336");
    } else {
        voteStatus.text("in progress").css("color", "#4caf50");
    }
}

function calculateRemainingDays() {
    const now = new Date();
    const endTime = new Date("2024-01-30T18:00:00");
    const remainingDays = Math.ceil((endTime - now) / (1000 * 60 * 60 * 24));
    
    if (remainingDays > 0) {
        $("#remainingDays").text(remainingDays + "day");
    } else if (remainingDays === 0) {
        $("#remainingDays").text("Last day");
    } else {
        $("#remainingDays").text("Ended");
    }
}

function loadCandidates() {
    const container = $("#candidatesContainer");
    
    container.html('<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading candidate data...</div>');
    
    container.empty();
    
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
    
    let candidates = JSON.parse(localStorage.getItem("candidates") || "[]");
    
    const eventCandidates = candidates.filter(c => c.eventId == currentEventId);
    
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

function voteForCandidate(candidateId) {
    if (!sessionStorage.getItem("username")) {
        showNotification("Please log in before voting.", "warning");
        return;
    }
    
    const currentEventId = localStorage.getItem('currentActiveEvent');
    if (!currentEventId) {
        showNotification("There are currently no active voting activities.", "warning");
        return;
    }

    const events = JSON.parse(localStorage.getItem('votingEvents') || '[]');
    const currentEvent = events.find(e => e.id == currentEventId);
    
    if (!currentEvent) {
        showNotification("The voting activity does not exist", "error");
        return;
    }
    
    const now = new Date();
    const startTime = new Date(currentEvent.startTime);
    const endTime = new Date(currentEvent.endTime);
    
    if (now < startTime) {
        showNotification("Voting has not yet begun.", "warning");
        return;
    }
    
    if (now > endTime) {
        showNotification("The voting campaign has ended.", "warning");
        return;
    }
    
    const remainingVotes = parseInt(sessionStorage.getItem("vote") || "10");
    if (remainingVotes <= 0) {
        showNotification("You have used up your votes for today.", "warning");
        return;
    }

    let candidates = JSON.parse(localStorage.getItem("candidates") || "[]");
    
    const candidateIndex = candidates.findIndex(c => c.id == candidateId && c.eventId == currentEventId);
    
    if (candidateIndex === -1) {
        showNotification("Cannot find candidates", "error");
        return;
    }
    
    candidates[candidateIndex].vote = (candidates[candidateIndex].vote || 0) + 1;
    
    localStorage.setItem("candidates", JSON.stringify(candidates));
    localStorage.setItem("carts", JSON.stringify(candidates));
    
    const newRemainingVotes = remainingVotes - 1;
    sessionStorage.setItem("vote", newRemainingVotes);
    
    $("#floatingVoteCount").text(newRemainingVotes);
    
    let voteRecords = JSON.parse(localStorage.getItem("voteRecords") || "[]");
    
    const voteRecord = {
        id: Date.now(),
        username: sessionStorage.getItem("username"),
        candidateId: candidateId,
        candidateName: candidates[candidateIndex].name,
        eventId: currentEventId,
        votedAt: new Date().toISOString(),
        ip: getClientIP()
    };
    
    voteRecords.push(voteRecord);
    localStorage.setItem("voteRecords", JSON.stringify(voteRecords));
    
    loadCandidates();
    
    updateStats();
    
    showNotification(`Successfully voted for ${candidates[candidateIndex].name}! Remaining votes: ${newRemainingVotes}`, "success");
    
    updateUserVoteCount();
}

function recordVote(candidate) {
    let voteRecords = JSON.parse(localStorage.getItem("voteRecords") || "[]");
    
    const voteRecord = {
        id: Date.now(),
        username: sessionStorage.getItem("username"),
        candidateId: candidate.id,
        candidateName: candidate.name,
        votedAt: new Date().toISOString(),
        ip: getClientIP()
    };
    
    voteRecords.push(voteRecord);
    localStorage.setItem("voteRecords", JSON.stringify(voteRecords));
}

function getClientIP() {
    const possibleIPs = [
        "192.168.1.100", "192.168.1.101", "192.168.1.102",
        "10.0.0.1", "10.0.0.2", "172.16.0.1"
    ];
    return possibleIPs[Math.floor(Math.random() * possibleIPs.length)];
}

function updateUserVoteCount() {
    const username = sessionStorage.getItem("username");
    if (!username) return;
    
    let users = JSON.parse(localStorage.getItem("users") || "[]");
    const userIndex = users.findIndex(u => u.username === username);
    
    if (userIndex !== -1) {
        const today = new Date().toISOString().split('T')[0];
        
        if (users[userIndex].lastVoteDate !== today) {
            users[userIndex].voteCount = 1;
            users[userIndex].lastVoteDate = today;
        } else {
            users[userIndex].voteCount = (users[userIndex].voteCount || 0) + 1;
        }
        
        localStorage.setItem("users", JSON.stringify(users));
    }
}

function updateStats() {
    const candidates = JSON.parse(localStorage.getItem("candidates") || "[]");
    
    const totalVotes = candidates.reduce((sum, candidate) => sum + (candidate.vote || 0), 0);
    $("#totalVotes").text(totalVotes);

    const voteRecords = JSON.parse(localStorage.getItem("voteRecords") || "[]");
    const today = new Date().toISOString().split('T')[0];
    const todayVotes = voteRecords.filter(record => {
        const recordDate = new Date(record.votedAt).toISOString().split('T')[0];
        return recordDate === today;
    }).length;
    
    $("#todayVotes").text(todayVotes);
    
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const totalUsers = users.length;
    const activeUsers = voteRecords.reduce((unique, record) => {
        if (!unique.includes(record.username)) {
            unique.push(record.username);
        }
        return unique;
    }, []).length;
    
    const participationRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
    $("#participationRate").text(participationRate + "%");
}

function refreshData() {
    loadCandidates();
    updateStats();
    showNotification("The data has been updated", "info");
}

function logout() {
    sessionStorage.clear();
    showNotification("Successfully logged out", "info");
    setTimeout(() => {
        location.reload();
    }, 1000);
}

function showNotification(message, type = "info") {
    $("#notificationContainer").empty();
    
    let backgroundColor = "";
    switch(type) {
        case "success":
            backgroundColor = "linear-gradient(135deg, #00b09b, #96c93d)";
            break;
        case "warning":
            backgroundColor = "linear-gradient(135deg, #ff9500, #ff5e3a)";
            break;
        case "error":
            backgroundColor = "linear-gradient(135deg, #ff416c, #ff4b2b)";
            break;
        default:
            backgroundColor = "linear-gradient(135deg, #4a00e0, #8e2de2)";
    }
    
    const notification = $(`
        <div class="notification">
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'error' ? 'times-circle' : 'info-circle'}" 
                   style="font-size: 20px;"></i>
                <div>
                    <strong>${type === 'success' ? 'success' : type === 'warning' ? 'warning' : type === 'error' ? 'error' : 'message'}</strong>
                    <p style="margin-top: 5px;">${message}</p>
                </div>
            </div>
        </div>
    `);
    
    notification.css("background", backgroundColor);
    
    $("#notificationContainer").append(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function updateUserInterface() {
    $(".candidate-card").hover(
        function() {
            $(this).addClass("hover");
        },
        function() {
            $(this).removeClass("hover");
        }
    );
}