# Poker Club Cash Game Dashboard

## 📋 Overview

A comprehensive web-based dashboard for managing poker club cash games, tracking player hours, running promotions, and maintaining detailed session histories. Built with React and designed for poker club managers who need to track player participation for promotions and rewards.

## 🎯 Key Features

### 1. **Active Tables Management**
- Real-time player seating system
- Sit In/Sit Out functionality with automatic time tracking
- Live duration display for active sessions
- Visual indicators for currently playing players

### 2. **Player Database**
- Complete player roster with contact information
- Automatic ranking by total hours played
- Detailed player profiles with historical data
- Daily statistics tracking
- Achievement system for promotion winners

### 3. **Dual Leaderboard System**
- **All-Time Leaderboard**: Overall rankings by total hours
- **Promotion Leaderboards**: Time-filtered rankings for specific periods
- Top 3 medal system (🥇🥈🥉)
- Real-time updates as sessions complete

### 4. **Promotion Management**
- Create custom promotional periods
- Automatic hour tracking within date ranges
- Historical leaderboard snapshots
- Archive system preserving all data
- Winner recognition and achievements

### 5. **Session History**
- Complete audit trail of all sessions
- Detailed timestamps (sit in/sit out times)
- Duration calculations
- Searchable and sortable records

### 6. **Data Management**
- Automatic browser storage (localStorage)
- Import/Export functionality for backups
- Club settings customization
- Complete data persistence

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js 14+ (for development)
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/poker-club-dashboard.git
cd poker-club-dashboard
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Start the development server**
```bash
npm start
# or
yarn start
```

4. **Open in browser**
Navigate to `http://localhost:3000`

## 💻 Usage Guide

### Initial Setup

1. **Configure Club Settings**
   - Navigate to Settings tab
   - Enter your club name and location
   - Set game stakes and table limits
   - Choose currency and timezone

2. **Add Players**
   - Go to Player Database tab
   - Click "Add Player"
   - Enter player name (required)
   - Add email and phone (optional)
   - Click Save

3. **Create Promotions**
   - Navigate to Promotions tab
   - Click "Create Promotion"
   - Set name and date range
   - Save the promotion

### Daily Operations

#### Recording Sessions

1. **Sitting In a Player**
   - Go to Active Tables tab
   - Search for player by name
   - Click "Sit In" to start tracking
   - Player appears in active tables grid

2. **Monitoring Active Sessions**
   - View real-time duration counters
   - Green pulse indicates active player
   - Multiple players can be seated simultaneously

3. **Sitting Out a Player**
   - Click red "Sit Out" button on player card
   - Confirm if session is under 1 minute
   - Session automatically saved to history
   - Player stats updated immediately

#### Viewing Statistics

1. **Player Statistics**
   - Click eye icon (👁️) on any player
   - View 30-day activity chart
   - Check promotion participation
   - Review recent sessions

2. **Leaderboards**
   - Navigate to Leaderboard tab
   - View all-time rankings
   - Check active promotion standings
   - Monitor player progress

3. **Session History**
   - Go to History tab
   - View all completed sessions
   - Sort by date, player, or duration
   - Export for reporting

### Data Management

#### Backing Up Data

1. **Export Data**
   - Go to Settings > Data Management
   - Click "Export All Data"
   - Save JSON file to safe location
   - Includes all players, sessions, and settings

2. **Import Data**
   - Go to Settings > Data Management
   - Click "Choose File" under Import
   - Select previously exported JSON
   - Confirm replacement of current data

#### Managing Promotions

1. **Creating Promotions**
   - Set clear start/end dates
   - Name promotions descriptively
   - Consider overlap with existing promotions

2. **Archiving Promotions**
   - Click archive button (📅) on completed promotions
   - Data preserved permanently
   - Winners receive achievements
   - Archived promotions shown separately

## 📊 Understanding the Data

### Player Metrics

- **Total Hours**: Cumulative time across all sessions
- **Sessions**: Number of times seated at table
- **Average Session**: Total hours divided by sessions
- **Daily Stats**: Hours and sessions per calendar day
- **Promotion History**: Hours within each promotion period

### Promotion Tracking

- **Active Promotions**: Currently running with valid dates
- **Leaderboard History**: Daily snapshots of top 10
- **Final Results**: Preserved when archived
- **Achievements**: Top 3 finishers receive medals

### Session Records

Each session stores:
- Player identification
- Exact sit in/out timestamps
- Calculated duration
- Date and time metadata
- Promotion associations

## 🛠️ Technical Details

### Technology Stack

- **Frontend**: React 18
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Storage**: Browser localStorage
- **State Management**: React Hooks

### Data Structure

```javascript
// Player Object
{
  id: unique_timestamp,
  name: "Player Name",
  email: "email@example.com",
  phone: "555-0123",
  joinDate: "2024-01-15",
  totalHours: 45.5,
  sessions: [...],
  dailyStats: {...},
  promotionHistory: {...},
  achievements: [...]
}

// Session Object
{
  id: unique_timestamp,
  playerId: player_id,
  playerName: "Player Name",
  date: "ISO_date_string",
  seatInTime: "ISO_timestamp",
  seatOutTime: "ISO_timestamp",
  duration: hours_decimal
}

// Promotion Object
{
  id: unique_timestamp,
  name: "Promotion Name",
  startDate: "YYYY-MM-DD",
  endDate: "YYYY-MM-DD",
  active: true/false,
  deleted: false,
  currentLeaderboard: [...],
  leaderboardHistory: [...]
}
```

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Storage Limits

- localStorage: ~5-10MB per domain
- Typical usage: <1MB for 1000+ sessions
- Auto-save on every change

## 🔧 Troubleshooting

### Common Issues

1. **Sit Out Button Not Working**
   - Ensure player is seated first
   - Check browser console for errors
   - Verify localStorage is enabled

2. **Data Not Saving**
   - Check browser privacy settings
   - Ensure localStorage not blocked
   - Try different browser/incognito mode

3. **Missing Players/Sessions**
   - Check if data was accidentally cleared
   - Restore from backup if available
   - Verify correct date ranges for promotions

### Best Practices

1. **Regular Backups**
   - Export data weekly
   - Before major changes
   - Keep multiple backup versions

2. **Promotion Management**
   - Set clear date boundaries
   - Archive completed promotions
   - Document promotion rules

3. **Session Recording**
   - Sit out players promptly
   - Verify durations are accurate
   - Monitor for duplicate entries

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact the development team
- Check documentation for updates

## 🎉 Acknowledgments

- Built for poker clubs worldwide
- Inspired by the need for accurate time tracking
- Designed with player promotions in mind

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Status**: Production Ready