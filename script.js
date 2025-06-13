document.addEventListener('DOMContentLoaded', () => {
  console.log("Welcome to TuneIn");
  
  // Initialize the player
  const player = new MusicPlayer();
  player.init();
});

if (localStorage.getItem('tuneInDarkMode') === 'true') {
  document.body.classList.add('dark');
}

class MusicPlayer {
  constructor() {
    // Core audio element
    this.audioElement = new Audio();
    
    // Player state
    this.currentSongIndex = 0;
    this.isPlaying = false;
    this.isShuffle = false;
    this.isMuted = false;
    this.volume = 0.5; // Default volume (0-1)
    this.playHistory = [];
    
    // Songs data
    this.songs = [
      { songName: "Eyy Bidda Ye Mera Adda", filePath: "songs/1.mpeg", coverPath: "covers/1.jpg", duration: "3:56" },
      { songName: "Srivalli", filePath: "songs/2.mpeg", coverPath: "covers/2.jpg", duration: "3:44" },
      { songName: "Tujhe Kitna Chahne Lage Hum", filePath: "songs/3.mpeg", coverPath: "covers/3.jpg", duration: "4:44" },
      { songName: "Pehla Pyaar", filePath: "songs/4.mpeg", coverPath: "covers/4.jpg", duration: "4:32" },
      { songName: "Lutt Putt Gaya", filePath: "songs/5.mpeg", coverPath: "covers/5.jpeg", duration: "3:43" },
      { songName: "O Maahi", filePath: "songs/6.mpeg", coverPath: "covers/6.jpeg", duration: "3:53" }
    ];
    
    // DOM Elements - will be initialized in init()
    this.masterPlay = null;
    this.progressBar = null;
    this.volumeBar = null;
    this.gifImage = null;
    this.masterSongName = null;
    this.currentTimeDisplay = null;
    this.durationDisplay = null;
    this.songItems = [];
    this.shuffleBtn = null;
    this.themeToggle = null;
    this.muteBtn = null;
    this.songList = null;
  }
  
  /**
   * Initialize the music player
   */
  init() {
    // Get DOM references
    this.masterPlay = document.getElementById("masterPlay");
    this.progressBar = document.getElementById("myProgressBar");
    this.volumeBar = document.getElementById("volumeBar");
    this.gifImage = document.getElementById("gif");
    this.masterSongName = document.getElementById("masterSongName");
    this.currentTimeDisplay = document.getElementById("currentTime");
    this.durationDisplay = document.getElementById("duration");
    this.shuffleBtn = document.getElementById("shuffleBtn");
    this.themeToggle = document.getElementById("themeToggle");
    this.muteBtn = document.getElementById("muteBtn");
    this.songList = document.getElementById("songList");
    
    // Load songs into UI
    this.populateSongList();
    
    // Set up audio element
    this.setupAudio();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Load saved preferences
    this.loadPreferences();
  }
  
  /**
   * Create and populate the song list
   */
  populateSongList() {
    // Get the template
    const template = document.getElementById("songItemTemplate");
    
    // Create song items from template
    this.songs.forEach((song, index) => {
      // Clone the template
      const songItem = document.importNode(template.content, true).querySelector('.songItem');
      
      // Set data attributes
      songItem.dataset.index = index;
      
      // Set song info
      const img = songItem.querySelector('img');
      img.src = song.coverPath;
      img.alt = `Cover image for ${song.songName}`;
      
      songItem.querySelector('.songName').textContent = song.songName;
      songItem.querySelector('.timestamp').textContent = song.duration;
      
      // Set play button ID for reference
      const playBtn = songItem.querySelector('.play-btn');
      playBtn.querySelector('i').dataset.index = index;
      
      // Add event listener directly
      playBtn.addEventListener('click', (e) => {
        const target = e.currentTarget.querySelector('i');
        const index = parseInt(target.dataset.index);
        this.playSong(index);
      });
      
      // Make whole song item clickable
      songItem.addEventListener('click', (e) => {
        // Only respond if not clicking the play button (that has its own handler)
        if (!e.target.closest('.play-btn')) {
          this.playSong(index);
        }
      });
      
      // Add keyboard accessibility
      songItem.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.playSong(index);
        }
      });
      
      // Add to DOM
      this.songList.appendChild(songItem);
    });
    
    // Store song item references for later use
    this.songItems = Array.from(document.querySelectorAll('.songItem'));
  }
  
  /**
   * Set up audio element and its event listeners
   */
  setupAudio() {
    // Set initial audio source
    this.audioElement.src = this.songs[this.currentSongIndex].filePath;
    this.audioElement.volume = this.volume;
    
    // Add audio event listeners
    this.audioElement.addEventListener('timeupdate', this.updateProgress.bind(this));
    this.audioElement.addEventListener('ended', this.handleSongEnd.bind(this));
    this.audioElement.addEventListener('canplay', this.updateDuration.bind(this));
    this.audioElement.addEventListener('play', () => this.isPlaying = true);
    this.audioElement.addEventListener('pause', () => this.isPlaying = false);
    
    // Handle errors
    this.audioElement.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      alert(`Error loading audio: ${this.songs[this.currentSongIndex].songName}`);
      this.playNext();
    });
  }
  
  /**
   * Set up all event listeners for the player
   */
  setupEventListeners() {
    // Master play/pause button
    this.masterPlay.addEventListener('click', () => {
      this.togglePlayPause();
    });
    
    // Progress bar
    this.progressBar.addEventListener('input', () => {
      const seekTime = (this.progressBar.value / 100) * this.audioElement.duration;
      this.audioElement.currentTime = seekTime;
    });
    
    // Volume control
    this.volumeBar.addEventListener('input', () => {
      this.volume = this.volumeBar.value / 100;
      this.audioElement.volume = this.volume;
      this.updateVolumeIcon();
      
      // Save volume preference
      localStorage.setItem('tuneInVolume', this.volume);
    });
    
    // Mute button
    this.muteBtn.addEventListener('click', () => {
      this.toggleMute();
    });
    
    // Shuffle toggle
    this.shuffleBtn.addEventListener('click', () => {
      this.toggleShuffle();
    });
    
    // Next/Previous buttons
    document.getElementById('next').addEventListener('click', () => {
      this.playNext();
    });
    
    document.getElementById('previous').addEventListener('click', () => {
      this.playPrevious();
    });
    
    // Theme toggle
    this.themeToggle.addEventListener('click', () => {
      this.toggleTheme();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Only if not in an input field
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        switch (e.key) {
          case ' ': // Space bar
            e.preventDefault();
            this.togglePlayPause();
            break;
          case 'ArrowRight':
            this.playNext();
            break;
          case 'ArrowLeft':
            this.playPrevious();
            break;
          case 'm':
          case 'M':
            this.toggleMute();
            break;
          case 's':
          case 'S':
            this.toggleShuffle();
            break;
          case 'd':
          case 'D':
            this.toggleTheme();
            break;
        }
      }
    });
  }
  
  /**
   * Update progress bar and time displays during playback
   */
  updateProgress() {
    if (this.audioElement.duration) {
      // Update progress bar
      const progress = (this.audioElement.currentTime / this.audioElement.duration) * 100;
      this.progressBar.value = progress;
      this.progressBar.setAttribute('aria-valuenow', progress);
      
      // Update time displays
      this.currentTimeDisplay.textContent = this.formatTime(this.audioElement.currentTime);
    }
  }
  
  /**
   * Update the duration display when metadata is loaded
   */
  updateDuration() {
    if (this.audioElement.duration) {
      this.durationDisplay.textContent = this.formatTime(this.audioElement.duration);
    }
  }
  
  /**
   * Format seconds into MM:SS format
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time string
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  
  /**
   * Toggle play/pause state
   */
  togglePlayPause() {
    if (this.isPlaying) {
      this.pauseSong();
    } else {
      this.resumeSong();
    }
  }
  
  /**
   * Pause the current song
   */
  pauseSong() {
    this.audioElement.pause();
    this.updatePlayPauseIcons(false);
    this.gifImage.style.opacity = 0;
  }
  
  /**
   * Resume playing the current song
   */
  resumeSong() {
    this.audioElement.play().catch(err => {
      console.error('Failed to play audio:', err);
    });
    this.updatePlayPauseIcons(true);
    this.gifImage.style.opacity = 1;
  }
  
  /**
   * Play a specific song by index
   * @param {number} index - Index of the song to play
   */
  playSong(index) {
    // Record history for "previous" functionality
    if (this.currentSongIndex !== index) {
      this.playHistory.push(this.currentSongIndex);
    }
    
    // Update current song index
    this.currentSongIndex = index;
    
    // Update audio source
    this.audioElement.src = this.songs[index].filePath;
    this.masterSongName.textContent = this.songs[index].songName;
    
    // Reset time and play
    this.audioElement.currentTime = 0;
    this.audioElement.play().catch(err => {
      console.error('Failed to play audio:', err);
    });
    
    // Update UI
    this.updatePlayPauseIcons(true);
    this.gifImage.style.opacity = 1;
    this.highlightActiveSong();
  }
  
  /**
   * Play the next song
   */
  playNext() {
    let nextIndex;
    
    if (this.isShuffle) {
      // Play a random song other than the current one
      nextIndex = this.getRandomSongIndex();
    } else {
      // Play the next song in order (with loop back to beginning)
      nextIndex = (this.currentSongIndex + 1) % this.songs.length;
    }
    
    this.playSong(nextIndex);
  }
  
  /**
   * Play the previous song or restart current if at beginning
   */
  playPrevious() {
    // If we have history, use it
    if (this.playHistory.length > 0 && !this.isShuffle) {
      this.playSong(this.playHistory.pop());
    } else if (this.isShuffle) {
      // In shuffle mode, just play another random song
      this.playSong(this.getRandomSongIndex());
    } else {
      // Either restart current song or go to previous
      if (this.audioElement.currentTime > 3) {
        // If more than 3 seconds in, restart the current song
        this.audioElement.currentTime = 0;
      } else {
        // Otherwise go to previous song (with loop to the end)
        const prevIndex = (this.currentSongIndex - 1 + this.songs.length) % this.songs.length;
        this.playSong(prevIndex);
      }
    }
  }
  
  /**
   * Get a random song index different from current
   * @returns {number} Random song index
   */
  getRandomSongIndex() {
    // If only one song, just return the same index
    if (this.songs.length <= 1) return 0;
    
    // Generate random index different from current
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * this.songs.length);
    } while (newIndex === this.currentSongIndex);
    
    return newIndex;
  }
  
  /**
   * Handle what happens when a song finishes playing
   */
  handleSongEnd() {
    this.playNext();
  }
  
  /**
   * Update all play/pause icons in the UI
   * @param {boolean} isPlaying - Whether audio is playing
   */
  updatePlayPauseIcons(isPlaying) {
    // Update master play button
    const masterPlayIcon = this.masterPlay.querySelector('i');
    masterPlayIcon.classList.remove('fa-circle-play', 'fa-circle-pause');
    masterPlayIcon.classList.add(isPlaying ? 'fa-circle-pause' : 'fa-circle-play');
    
    // Update song item play buttons
    this.songItems.forEach((item, i) => {
      const icon = item.querySelector('.songItemPlay');
      icon.classList.remove('fa-circle-play', 'fa-circle-pause');
      
      if (i === this.currentSongIndex && isPlaying) {
        icon.classList.add('fa-circle-pause');
      } else {
        icon.classList.add('fa-circle-play');
      }
    });
  }
  
  /**
   * Update volume icon based on current volume state
   */
  updateVolumeIcon() {
    const icon = this.muteBtn.querySelector('i') || this.muteBtn;
    icon.classList.remove('fa-volume-high', 'fa-volume-low', 'fa-volume-xmark');
    
    if (this.isMuted || this.volume === 0) {
      icon.classList.add('fa-volume-xmark');
    } else if (this.volume < 0.5) {
      icon.classList.add('fa-volume-low');
    } else {
      icon.classList.add('fa-volume-high');
    }
  }
  
  /**
   * Toggle mute state
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.audioElement.muted = this.isMuted;
    this.updateVolumeIcon();
  }
  
  /**
   * Toggle shuffle mode
   */
  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    this.shuffleBtn.classList.toggle('active', this.isShuffle);
    this.shuffleBtn.setAttribute('aria-pressed', this.isShuffle);
    
    // Update icon
    const icon = this.shuffleBtn.querySelector('i') || this.shuffleBtn;
    icon.style.color = this.isShuffle ? '#ffffff' : '#d1d5db';
    
    // Save preference
    localStorage.setItem('tuneInShuffle', this.isShuffle);
  }
  
  /**
   * Toggle dark/light theme
   */
  toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    
    // Update button state
    this.themeToggle.classList.toggle('active', isDark);
    this.themeToggle.setAttribute('aria-pressed', isDark);
    
    // Update icon
    const icon = this.themeToggle.querySelector('i') || this.themeToggle;
    icon.classList.remove('fa-moon', 'fa-sun');
    icon.classList.add(isDark ? 'fa-sun' : 'fa-moon');
    
    // Save preference
    localStorage.setItem('tuneInDarkMode', isDark);
  }
  
  /**
   * Highlight the currently active song in the UI
   */
  highlightActiveSong() {
    this.songItems.forEach((item, i) => {
      item.classList.toggle('active-song', i === this.currentSongIndex);
      item.setAttribute('aria-current', i === this.currentSongIndex ? 'true' : 'false');
    });
  }
  
  /**
   * Load user preferences from localStorage
   */
  loadPreferences() {
    // Load volume
    const savedVolume = localStorage.getItem('tuneInVolume');
    if (savedVolume !== null) {
      this.volume = parseFloat(savedVolume);
      this.audioElement.volume = this.volume;
      this.volumeBar.value = this.volume * 100;
    }
    
    // Load shuffle state
    const savedShuffle = localStorage.getItem('tuneInShuffle');
    if (savedShuffle !== null) {
      this.isShuffle = savedShuffle === 'true';
      this.shuffleBtn.classList.toggle('active', this.isShuffle);
      this.shuffleBtn.setAttribute('aria-pressed', this.isShuffle);
      
      const shuffleIcon = this.shuffleBtn.querySelector('i') || this.shuffleBtn;
      shuffleIcon.style.color = this.isShuffle ? '#ffffff' : '#d1d5db';
    }
    
    // Load theme
    const savedDarkMode = localStorage.getItem('tuneInDarkMode');
    if (savedDarkMode !== null) {
      const isDark = savedDarkMode === 'true';
      document.body.classList.toggle('dark', isDark);
      
      this.themeToggle.classList.toggle('active', isDark);
      this.themeToggle.setAttribute('aria-pressed', isDark);
      
      const themeIcon = this.themeToggle.querySelector('i') || this.themeToggle;
      themeIcon.classList.remove('fa-moon', 'fa-sun');
      themeIcon.classList.add(isDark ? 'fa-sun' : 'fa-moon');
    }
    
    // Update initial UI
    this.updateVolumeIcon();
    this.updatePlayPauseIcons(false);
    this.highlightActiveSong();
  }
}