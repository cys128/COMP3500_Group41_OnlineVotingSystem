document.addEventListener('DOMContentLoaded', function() {
    initializeSystem();
    
    checkAdminLink();
});

function initializeSystem() {
    if (!localStorage.getItem('votingEvents')) {
        localStorage.setItem('votingEvents', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('candidates')) {
        localStorage.setItem('candidates', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('voteRecords')) {
        localStorage.setItem('voteRecords', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    
    console.log('System initialization complete');
}

function checkAdminLink() {
    var adminLink = document.getElementById('adminLink');
    if (adminLink) {
        var isAdmin = sessionStorage.getItem('is_admin') === 'true';
        if (isAdmin) {
            adminLink.style.display = 'inline';
        }
    }
}

function checkSystemStatus() {
    var events = JSON.parse(localStorage.getItem('votingEvents') || '[]');
    var candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
    var users = JSON.parse(localStorage.getItem('users') || '[]');
    
    console.log('System status check:');
    console.log('- Voting event:', events.length);
    console.log('- candidate:', candidates.length);
    console.log('- Registered users:', users.length);
    console.log('- Active events:', events.filter(e => e.status === 'active').length);
    
    return {
        events: events.length,
        candidates: candidates.length,
        users: users.length,
        activeEvents: events.filter(e => e.status === 'active').length
    };
}