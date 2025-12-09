$(document).ready(function() {
    initEventManager();
    
    bindDeleteEvents();
});

function initEventManager() {
    console.log('The event manager has been initialized.');
    
    if (!localStorage.getItem('votingEvents')) {
        console.log('No voting event data found. Create sample data.');
        createSampleEvents();
    }
    
    loadEventsList();
}

function loadEventsList() {
    console.log('Start loading event list');
    
    const events = JSON.parse(localStorage.getItem('votingEvents') || '[]');
    const tbody = $('#eventsTable tbody');
    const noEventsMessage = $('#noEventsMessage');
    
    tbody.empty();
    
    if (events.length === 0) {
        console.log('No event data');
        tbody.hide();
        noEventsMessage.show();
        return;
    }
    
    noEventsMessage.hide();
    tbody.show();
    
    console.log(`Find ${events.length} events`);
    
    events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
    
    events.forEach(event => {
        const eventCandidates = candidates.filter(c => c.eventId == event.id);
        const candidateCount = eventCandidates.length;
        
        const totalVotes = eventCandidates.reduce((sum, candidate) => sum + (candidate.vote || 0), 0);
        
        const currentActiveEventId = localStorage.getItem('currentActiveEvent');
        const isActiveEvent = currentActiveEventId == event.id;
        
        const formatDate = (dateString) => {
            if (!dateString) return 'Not set';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('zh-CN');
            } catch (e) {
                return dateString;
            }
        };
        
        let statusText = event.status || 'Not set';
        let statusClass = 'status-' + statusText;
        
        if (!['active', 'pending', 'ended'].includes(event.status)) {
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
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${event.id}</td>
            <td>
                <strong>${event.title}</strong>
                ${isActiveEvent ? '<br><small style="color: #4a00e0;">(Current active events)</small>' : ''}
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
    
    console.log('Event list loading complete');
}

function activateEventById(eventId) {
    console.log('Activation event:', eventId);
    
    const events = JSON.parse(localStorage.getItem('votingEvents') || '[]');
    const event = events.find(e => e.id == eventId);
    
    if (!event) {
        showNotification('The voting event could not be found.', 'error');
        return;
    }
    
    localStorage.setItem('currentActiveEvent', eventId.toString());
    
    showNotification(`Activated events: ${event.title}`, 'success');
    
    loadEventsList();
}

function deleteEventById(eventId, eventTitle) {
    console.log('Request to delete event:', eventId, eventTitle);
    

    if (!confirm(`Confirm the need to delete the voting event "${eventTitle}" ？\n\nThis operation will delete the event and all associated candidate data.`)) {
        return;
    }
    
    let events = JSON.parse(localStorage.getItem('votingEvents') || '[]');
    let candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
    let voteRecords = JSON.parse(localStorage.getItem('voteRecords') || '[]');
    
    const eventToDelete = events.find(e => e.id == eventId);
    if (!eventToDelete) {
        showNotification('No event to be deleted found.', 'error');
        return;
    }
    
    console.log('Start Delet Event:', eventToDelete);
    
    events = events.filter(e => e.id != eventId);
    console.log(`Remaining events after deleting them from the event list: ${events.length} event`);
    
    const candidatesBefore = candidates.length;
    candidates = candidates.filter(c => c.eventId != eventId);
    console.log(`Candidate List: from ${candidatesBefore} Delete to ${candidates.length}`);
    
    const recordsBefore = voteRecords.length;
    voteRecords = voteRecords.filter(r => r.eventId != eventId);
    console.log(`Voting records: from ${recordsBefore} Delete to ${voteRecords.length}`);
    
    localStorage.setItem('votingEvents', JSON.stringify(events));
    localStorage.setItem('candidates', JSON.stringify(candidates));
    localStorage.setItem('carts', JSON.stringify(candidates));
    localStorage.setItem('voteRecords', JSON.stringify(voteRecords));
    
    if (localStorage.getItem('currentActiveEvent') == eventId) {
        localStorage.removeItem('currentActiveEvent');
        
        if (events.length > 0) {
            localStorage.setItem('currentActiveEvent', events[0].id.toString());
            showNotification(`Automatically set"${events[0].title}"For new active events`, 'info');
        } else {
            showNotification('The last voting event has been deleted. Please create a new event.', 'warning');
        }
    }
    
    console.log('Event deletion complete, list reloaded.');
    
    showNotification(`Voting event"${eventTitle}"Successfully deleted`, 'success');
    
    loadEventsList();
    
    refreshRelatedPages();
}

function refreshRelatedPages() {
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

function bindDeleteEvents() {
    console.log('Bind delete event');
    
    $(document).on('click', '.btn-delete-event', function() {
        console.log('The delete button was clicked');
        
        const eventId = $(this).data('event-id');
        const eventTitle = $(this).data('event-title');
        
        if (eventId) {
            deleteEventById(eventId, eventTitle);
        } else {
            console.error('Unable to obtain event ID');
        }
    });
}

function showNotification(message, type = 'info') {
    $('.notification').remove();
    
    let bgColor = '#4a00e0';
    let icon = 'info-circle';
    
    switch(type) {
        case 'success':
            bgColor = '#00b09b';
            icon = 'check-circle';
            break;
        case 'warning':
            bgColor = '#ff9500';
            icon = 'exclamation-triangle';
            break;
        case 'error':
            bgColor = '#ff416c';
            icon = 'times-circle';
            break;
    }
    
    const notification = $(`
        <div class="notification" style="
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${bgColor};
            color: white;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.5s ease;
        ">
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-${icon}" style="font-size: 20px;"></i>
                <div>
                    <strong>${type === 'success' ? '成功' : type === 'warning' ? '警告' : type === 'error' ? '错误' : '信息'}</strong>
                    <p style="margin-top: 5px;">${message}</p>
                </div>
            </div>
        </div>
    `);
    
    $('body').append(notification);
    
    setTimeout(() => {
        notification.fadeOut(500, function() {
            $(this).remove();
        });
    }, 3000);
}

window.loadEventsList = loadEventsList;
window.activateEventById = activateEventById;
window.deleteEventById = deleteEventById;