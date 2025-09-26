# MLB Playoff Permutation Simulator

A lightweight, interactive web app that lets users explore both American League and National League playoff scenarios based on the final 3-game series outcomes for key teams.

## Features

### Phase 1: Simulation Mode
- **League Selection**: Toggle between American League and National League
- **Interactive Sliders**: Control game outcomes for key series

**American League:**
  - Guardians vs Rangers (0-3 wins)
  - Red Sox vs Tigers (0-3 wins) 
  - Astros vs Angels (0-3 wins)
  - Yankees Final Wins (0-3 additional wins)
  - Blue Jays Final Wins (0-3 additional wins)

**National League:**
  - Cubs vs Cardinals (0-3 wins)
  - Padres vs Diamondbacks (0-3 wins)
  - Mets vs Marlins (0-3 wins)
  - Brewers Final Wins (0-3 additional wins)
  - Phillies Final Wins (0-3 additional wins)

- **Logic Engine**: 
  - Calculates final records based on slider inputs
  - Applies MLB tiebreaker rules from [MLB.com playoff picture](https://www.mlb.com/news/mlb-playoff-picture-and-bracket-2025)
  - Determines playoff seeding for both leagues

- **Dynamic Output Table**: Shows team final records and playoff outcomes
- **Bracket Visualization**: Displays Wild Card Series and Division Series matchups
- **Control Options**: Division winner override and bracket toggle

### Phase 2: Live Data Mode
- **Mode Toggle**: Switch between simulation and live data modes
- **Live Game Display**: Shows current game scores, status, and timing
- **Auto-Refresh**: Updates every 2 minutes during games
- **Real-Time Playoff Picture**: Updates based on live game results
- **Fallback Handling**: Graceful degradation when live data unavailable

## Current Standings (Sep 26, 2025)

**American League:**
- **AL East**: Yankees & Blue Jays (both 91-68, Blue Jays clinched head-to-head)
- **AL Central**: Guardians & Tigers (both 86-73, Guardians clinched head-to-head)
- **Wild Card**: Red Sox (87-72), Tigers (86-73), Astros (85-74)

**National League:**
- **NL Central**: Brewers (96-63, clinched)
- **NL East**: Phillies (94-65, clinched)
- **NL West**: Dodgers (90-69, clinched)
- **Wild Card**: Cubs (89-70), Padres (87-72), Mets (82-77)

## Tiebreaker Rules (from MLB.com)
**American League:**
- Blue Jays > Yankees (clinched head-to-head)
- Guardians > Tigers (clinched head-to-head)
- Tigers > Astros
- Red Sox > Guardians & Astros

**National League:**
- Brewers > Phillies
- Padres > Cubs (intradivision record)
- Reds > Mets & D-backs (intradivision record)

## Usage

1. **League Selection**: Choose between American League and National League
2. **Simulation Mode**: Use sliders to explore different game outcomes
3. **Live Data Mode**: View real-time game data and playoff picture
4. **Auto-Refresh**: Toggle automatic updates in live mode
5. **Bracket View**: Show/hide playoff bracket visualization

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **No Backend**: Pure client-side application
- **Hosting**: GitHub Pages ready
- **Responsive**: Mobile-friendly design
- **Modern UI**: Glassmorphism styling with smooth animations

## Future Enhancements

- Integration with official MLB API for live data
- Historical scenario comparison
- Export functionality for playoff scenarios
- Mobile app version

## Default State

When the page loads, sliders are set to:
- Guardians: 3 wins (sweep)
- Red Sox: 3 wins (sweep)
- Astros: 3 wins (sweep)
- Yankees: 2 wins
- Blue Jays: 2 wins

**Result**: "Home teams sweep, AL East stays tied"
