const PAYPAL_LINK = "https://paypal.me/DivyaDivya9325/3";

document.addEventListener('DOMContentLoaded', function() {
  loadSessions();
  checkFreeLimit();
  
  document.getElementById('save').addEventListener('click', saveTabs);
  document.getElementById('restore').addEventListener('click', restoreLastSession);
  document.getElementById('upgradeBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: PAYPAL_LINK });
  });
});

async function saveTabs() {
  const sessionName = document.getElementById('sessionName').value || 'Session ' + new Date().toLocaleDateString();
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const tabData = tabs.map(tab => ({ url: tab.url, title: tab.title }));
  
  chrome.storage.local.get(['sessions', 'isPro'], (result) => {
    const sessions = result.sessions || [];
    const isPro = result.isPro || false;
    
    if (!isPro && sessions.length >= 3) {
      alert('Free limit reached! Upgrade to Pro for unlimited saves.');
      return;
    }
    
    sessions.push({ name: sessionName, tabs: tabData, date: new Date().toLocaleString() });
    chrome.storage.local.set({ sessions }, () => {
      alert(`Saved ${tabData.length} tabs as "${sessionName}"`);
      loadSessions();
      checkFreeLimit();
    });
  });
}

function restoreLastSession() {
  chrome.storage.local.get(['sessions'], (result) => {
    const sessions = result.sessions || [];
    if (sessions.length === 0) {
      alert('No saved sessions');
      return;
    }
    const lastSession = sessions[sessions.length - 1];
    lastSession.tabs.forEach(tab => chrome.tabs.create({ url: tab.url }));
    alert(`Restored ${lastSession.tabs.length} tabs from "${lastSession.name}"`);
  });
}

function loadSessions() {
  chrome.storage.local.get(['sessions'], (result) => {
    const sessions = result.sessions || [];
    const container = document.getElementById('sessions');
    
    if (sessions.length === 0) {
      container.innerHTML = '<h4 style="margin: 10px 0 5px 0;">Saved Sessions:</h4><p style="color: #6b7280; text-align: center;">No sessions saved yet</p>';
      return;
    }
    
    let html = '<h4 style="margin: 10px 0 5px 0;">Saved Sessions:</h4>';
    sessions.forEach((session, index) => {
      html += `
        <div class="session">
          <strong>${session.name}</strong><br>
          <small>${session.tabs.length} tabs • ${session.date}</small><br>
          <button class="session-btn" onclick="restoreSession(${index})">Restore</button>
          <button class="session-btn" onclick="deleteSession(${index})">Delete</button>
        </div>
      `;
    });
    container.innerHTML = html;
  });
}

function checkFreeLimit() {
  chrome.storage.local.get(['sessions', 'isPro'], (result) => {
    const sessions = result.sessions || [];
    const isPro = result.isPro || false;
    const freeLimit = document.getElementById('freeLimit');
    
    if (!isPro) {
      const remaining = Math.max(0, 3 - sessions.length);
      freeLimit.textContent = `Free sessions left: ${remaining}/3`;
      if (sessions.length >= 3) {
        document.getElementById('save').style.background = '#9ca3af';
        document.getElementById('save').disabled = true;
      }
    } else {
      freeLimit.textContent = '⭐ Pro User: Unlimited saves';
      freeLimit.style.color = '#10b981';
    }
  });
}

window.restoreSession = (index) => {
  chrome.storage.local.get(['sessions'], (result) => {
    result.sessions[index].tabs.forEach(tab => chrome.tabs.create({ url: tab.url }));
  });
};

window.deleteSession = (index) => {
  chrome.storage.local.get(['sessions'], (result) => {
    const sessions = result.sessions;
    sessions.splice(index, 1);
    chrome.storage.local.set({ sessions }, () => {
      loadSessions();
      checkFreeLimit();
    });
  });
};