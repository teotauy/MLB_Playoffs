// AL Playoff Permutation Simulator
class PlayoffSimulator {
    constructor() {
        this.currentMode = 'simulation';
        this.autoRefreshInterval = null;
        this.lastUpdateTime = null;
        this.finalGameResults = {}; // Track final game results
        this.lastTimestampUpdate = null;
        // Current standings (as of Sep 26, 2025 from MLB.com playoff picture)
        this.currentStandings = {
            // American League
            al: {
                yankees: { wins: 91, losses: 68, gamesLeft: 3 },
                bluejays: { wins: 91, losses: 68, gamesLeft: 3 },
                guardians: { wins: 86, losses: 73, gamesLeft: 3 },
                tigers: { wins: 86, losses: 73, gamesLeft: 3 },
                redsox: { wins: 87, losses: 72, gamesLeft: 3 },
                astros: { wins: 85, losses: 74, gamesLeft: 3 },
                orioles: { wins: 75, losses: 84, gamesLeft: 3 },
                rays: { wins: 77, losses: 82, gamesLeft: 3 },
                rangers: { wins: 80, losses: 79, gamesLeft: 3 },
                angels: { wins: 71, losses: 88, gamesLeft: 3 }
            },
            // National League
            nl: {
                brewers: { wins: 96, losses: 63, gamesLeft: 3 },
                phillies: { wins: 94, losses: 65, gamesLeft: 3 },
                dodgers: { wins: 90, losses: 69, gamesLeft: 3 },
                cubs: { wins: 89, losses: 70, gamesLeft: 3 },
                padres: { wins: 87, losses: 72, gamesLeft: 3 },
                mets: { wins: 82, losses: 77, gamesLeft: 3 },
                cardinals: { wins: 86, losses: 73, gamesLeft: 3 },
                diamondbacks: { wins: 86, losses: 73, gamesLeft: 3 },
                marlins: { wins: 85, losses: 74, gamesLeft: 3 },
                reds: { wins: 85, losses: 74, gamesLeft: 3 }
            }
        };

        // Tiebreaker rules (from MLB.com playoff picture)
        this.tiebreakers = {
            al: {
                'bluejays-yankees': 'bluejays',    // Blue Jays > Yankees (clinched head-to-head)
                'bluejays-mariners': 'bluejays',   // Blue Jays > Mariners
                'yankees-mariners': 'yankees',     // Yankees > Mariners
                'guardians-tigers': 'guardians',   // Guardians > Tigers (clinched head-to-head)
                'guardians-astros': 'guardians',   // Guardians > Astros
                'tigers-astros': 'tigers',         // Tigers > Astros
                'redsox-guardians': 'redsox',      // Red Sox > Guardians
                'redsox-tigers': 'tigers',         // Tigers > Red Sox (3-0, 3 games left)
                'astros-redsox': 'redsox'          // Red Sox > Astros
            },
            nl: {
                'brewers-phillies': 'brewers',     // Brewers > Phillies
                'cubs-padres': 'padres',           // Padres > Cubs (intradivision record)
                'mets-reds': 'reds',               // Reds > Mets (intradivision record)
                'mets-dbacks': 'dbacks',           // D-backs > Mets (intradivision record)
                'reds-dbacks': 'reds'              // Reds > D-backs
            }
        };

        this.currentLeague = 'al';
        this.permutationChart = null;

        this.initializeEventListeners();
        this.initializeOverallRecords();
        this.updateSimulation();
        this.updateTimestamp();
        this.startLiveGameTracking();
    }

    initializeEventListeners() {
        // League toggle event listeners
        document.getElementById('al-league').addEventListener('click', () => {
            this.switchLeague('al');
        });

        document.getElementById('nl-league').addEventListener('click', () => {
            this.switchLeague('nl');
        });

        // Mode toggle event listeners
        document.getElementById('simulation-mode').addEventListener('click', () => {
            this.switchMode('simulation');
        });

        document.getElementById('live-mode').addEventListener('click', () => {
            this.switchMode('live');
        });

        // Auto-refresh toggle
        document.getElementById('auto-refresh').addEventListener('change', (e) => {
            if (this.currentMode === 'live') {
                if (e.target.checked) {
                    this.startAutoRefresh();
                } else {
                    this.stopAutoRefresh();
                }
            }
        });

        // Slider event listeners (will be set up dynamically based on league)
        this.setupSliderListeners();

        // Dropdown event listeners
        document.getElementById('division-override').addEventListener('change', () => {
            this.updateSimulation();
        });

        document.getElementById('bracket-toggle').addEventListener('change', (e) => {
            const bracketSection = document.getElementById('bracket-section');
            if (e.target.value === 'hide') {
                bracketSection.classList.add('hidden');
            } else {
                bracketSection.classList.remove('hidden');
            }
        });

        // Initialize permutation table
        this.generatePermutationTable();
        
        // Preset scenario event listeners
        document.getElementById('home-team-wins').addEventListener('click', () => {
            this.applyPresetScenario('home-wins');
        });
        
        document.getElementById('better-record-wins').addEventListener('click', () => {
            this.applyPresetScenario('better-record');
        });
        
        document.getElementById('reset-scenario').addEventListener('click', () => {
            this.applyPresetScenario('reset');
        });
    }

    initializeOverallRecords() {
        // Initialize all overall records based on current slider positions
        const alSliders = ['rangers-guardians', 'tigers-redsox', 'astros-angels', 'orioles-yankees', 'rays-bluejays'];
        const nlSliders = ['cubs-cardinals', 'diamondbacks-padres', 'mets-marlins', 'reds-brewers'];
        
        // Initialize AL records
        alSliders.forEach(sliderId => {
            const slider = document.getElementById(sliderId);
            if (slider) {
                this.updateSeriesWins(sliderId, slider.value);
            }
        });
        
        // Initialize NL records
        nlSliders.forEach(sliderId => {
            const slider = document.getElementById(sliderId);
            if (slider) {
                this.updateSeriesWins(sliderId, slider.value);
            }
        });
    }

    switchLeague(league) {
        this.currentLeague = league;
        
        // Update UI
        const alBtn = document.getElementById('al-league');
        const nlBtn = document.getElementById('nl-league');
        const alSliders = document.getElementById('al-sliders');
        const nlSliders = document.getElementById('nl-sliders');
        const divisionLabel = document.getElementById('division-override-label');
        const divisionSelect = document.getElementById('division-override');
        
        if (league === 'al') {
            alBtn.classList.add('active');
            nlBtn.classList.remove('active');
            alSliders.classList.remove('hidden');
            nlSliders.classList.add('hidden');
            divisionLabel.textContent = 'AL East Winner Override';
            divisionSelect.innerHTML = `
                <option value="auto">Auto (based on record)</option>
                <option value="yankees">Yankees</option>
                <option value="bluejays">Blue Jays</option>
            `;
        } else {
            nlBtn.classList.add('active');
            alBtn.classList.remove('active');
            nlSliders.classList.remove('hidden');
            alSliders.classList.add('hidden');
            divisionLabel.textContent = 'NL Top Seed Override';
            divisionSelect.innerHTML = `
                <option value="auto">Auto (based on record)</option>
                <option value="brewers">Brewers</option>
                <option value="phillies">Phillies</option>
            `;
        }
        
        this.setupSliderListeners();
        this.updateSimulation();
        this.generatePermutationTable();
    }

    setupSliderListeners() {
        // Remove existing listeners first to prevent duplicates
        const allSliders = ['rangers-guardians', 'tigers-redsox', 'astros-angels', 'orioles-yankees', 'rays-bluejays',
                           'cubs-cardinals', 'diamondbacks-padres', 'mets-marlins', 'reds-brewers'];
        
        allSliders.forEach(sliderId => {
            const slider = document.getElementById(sliderId);
            if (slider) {
                // Clone the element to remove all event listeners
                const newSlider = slider.cloneNode(true);
                slider.parentNode.replaceChild(newSlider, slider);
            }
        });

        const leagueSliders = this.currentLeague === 'al' 
            ? ['rangers-guardians', 'tigers-redsox', 'astros-angels', 'orioles-yankees', 'rays-bluejays']
            : ['cubs-cardinals', 'diamondbacks-padres', 'mets-marlins', 'reds-brewers'];
            
        leagueSliders.forEach(sliderId => {
            const slider = document.getElementById(sliderId);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    console.log('Slider changed:', sliderId, 'value:', e.target.value);
                    this.updateSeriesWins(sliderId, e.target.value);
                    this.updateSimulation();
                });
            }
        });
    }

    updateSeriesWins(sliderId, sliderValue) {
        const sliderPos = parseInt(sliderValue);
        // Slider position 0 = away team sweeps (3 wins), position 3 = home team sweeps (3 wins)
        const awayWins = 3 - sliderPos;
        const homeWins = sliderPos;
        
        switch(sliderId) {
            case 'rangers-guardians':
                document.getElementById('rangers-wins').textContent = awayWins;
                document.getElementById('guardians-wins').textContent = homeWins;
                this.updateOverallRecord('rangers', awayWins);
                this.updateOverallRecord('guardians', homeWins);
                break;
            case 'tigers-redsox':
                document.getElementById('tigers-wins').textContent = awayWins;
                document.getElementById('redsox-wins').textContent = homeWins;
                this.updateOverallRecord('tigers', awayWins);
                this.updateOverallRecord('redsox', homeWins);
                break;
            case 'astros-angels':
                document.getElementById('astros-wins').textContent = awayWins;
                document.getElementById('angels-wins').textContent = homeWins;
                this.updateOverallRecord('astros', awayWins);
                this.updateOverallRecord('angels', homeWins);
                break;
            case 'orioles-yankees':
                document.getElementById('orioles-wins').textContent = awayWins;
                document.getElementById('yankees-wins').textContent = homeWins;
                this.updateOverallRecord('orioles', awayWins);
                this.updateOverallRecord('yankees', homeWins);
                break;
            case 'rays-bluejays':
                document.getElementById('rays-wins').textContent = awayWins;
                document.getElementById('bluejays-wins').textContent = homeWins;
                this.updateOverallRecord('rays', awayWins);
                this.updateOverallRecord('bluejays', homeWins);
                break;
            case 'cubs-cardinals':
                document.getElementById('cubs-wins').textContent = awayWins;
                document.getElementById('cardinals-wins').textContent = homeWins;
                this.updateOverallRecord('cubs', awayWins);
                this.updateOverallRecord('cardinals', homeWins);
                break;
            case 'diamondbacks-padres':
                document.getElementById('diamondbacks-wins').textContent = awayWins;
                document.getElementById('padres-wins').textContent = homeWins;
                this.updateOverallRecord('diamondbacks', awayWins);
                this.updateOverallRecord('padres', homeWins);
                break;
            case 'mets-marlins':
                document.getElementById('mets-wins').textContent = awayWins;
                document.getElementById('marlins-wins').textContent = homeWins;
                this.updateOverallRecord('mets', awayWins);
                this.updateOverallRecord('marlins', homeWins);
                break;
            case 'reds-brewers':
                document.getElementById('reds-wins').textContent = awayWins;
                document.getElementById('brewers-wins').textContent = homeWins;
                this.updateOverallRecord('reds', awayWins);
                this.updateOverallRecord('brewers', homeWins);
                break;
        }
    }

    updateOverallRecord(teamKey, additionalWins) {
        const currentStandings = this.currentStandings[this.currentLeague];
        const team = currentStandings[teamKey];
        
        if (team) {
            const finalWins = team.wins + additionalWins;
            const finalLosses = team.losses + (team.gamesLeft - additionalWins);
            const simulatedElement = document.getElementById(`${teamKey}-simulated`);
            
            if (simulatedElement) {
                simulatedElement.textContent = `${finalWins}-${finalLosses}`;
            }
        }
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // Update UI
        const simBtn = document.getElementById('simulation-mode');
        const liveBtn = document.getElementById('live-mode');
        const simControls = document.getElementById('simulation-controls');
        const liveSection = document.getElementById('live-data-section');
        const modeDescription = document.getElementById('mode-description');
        const outputSubtitle = document.getElementById('output-subtitle');
        
        if (mode === 'simulation') {
            simBtn.classList.add('active');
            liveBtn.classList.remove('active');
            simControls.classList.remove('hidden');
            liveSection.classList.add('hidden');
            modeDescription.textContent = 'Explore different game outcomes using sliders below';
            outputSubtitle.textContent = 'Dynamically updates based on slider inputs:';
            this.stopAutoRefresh();
            this.updateSimulation();
        } else {
            liveBtn.classList.add('active');
            simBtn.classList.remove('active');
            simControls.classList.add('hidden');
            liveSection.classList.remove('hidden');
            modeDescription.textContent = 'View live game data and current playoff picture';
            outputSubtitle.textContent = 'Updates with live game results (shows "if the game ends now" scenarios):';
            this.loadLiveData();
            if (document.getElementById('auto-refresh').checked) {
                this.startAutoRefresh();
            }
        }
    }

    updateSimulation() {
        console.log('updateSimulation called, currentMode:', this.currentMode);
        if (this.currentMode !== 'simulation') {
            console.log('Not in simulation mode, returning early');
            return;
        }
        
        const sliderValues = this.getSliderValues();
        console.log('Slider values:', sliderValues);
        const finalStandings = this.calculateFinalStandings(sliderValues);
        console.log('Final standings:', finalStandings);
        
        // Show the key AL Central teams
        if (this.currentLeague === 'al') {
            console.log('AL Central Race:');
            console.log('Guardians:', finalStandings.guardians.wins + '-' + finalStandings.guardians.losses);
            console.log('Tigers:', finalStandings.tigers.wins + '-' + finalStandings.tigers.losses);
        }
        
        const playoffPicture = this.determinePlayoffPicture(finalStandings);
        console.log('Playoff picture:', playoffPicture);
        
        this.updateOutputTable(finalStandings, playoffPicture);
        this.updateBracket(playoffPicture);
        this.updateRecordDisplays(sliderValues);
    }

    getSliderValues() {
        if (this.currentLeague === 'al') {
            // Get slider positions and calculate wins correctly
            const rangersSlider = parseInt(document.getElementById('rangers-guardians').value);
            const tigersSlider = parseInt(document.getElementById('tigers-redsox').value);
            const astrosSlider = parseInt(document.getElementById('astros-angels').value);
            const oriolesSlider = parseInt(document.getElementById('orioles-yankees').value);
            const raysSlider = parseInt(document.getElementById('rays-bluejays').value);
            
            return {
                // Away teams get 3 minus slider position
                rangers: 3 - rangersSlider,
                tigers: 3 - tigersSlider,
                astros: 3 - astrosSlider,
                orioles: 3 - oriolesSlider,
                rays: 3 - raysSlider,
                // Home teams get slider position value
                guardians: rangersSlider,
                redsox: tigersSlider,
                angels: astrosSlider,
                yankees: oriolesSlider,
                bluejays: raysSlider
            };
        } else {
            // Get away team wins from sliders, calculate home team wins
            const cubsWins = parseInt(document.getElementById('cubs-cardinals').value);
            const diamondbacksWins = parseInt(document.getElementById('diamondbacks-padres').value);
            const metsWins = parseInt(document.getElementById('mets-marlins').value);
            const redsWins = parseInt(document.getElementById('reds-brewers').value);
            
            return {
                // Away teams get 3 minus slider value
                cubs: 3 - cubsWins,
                diamondbacks: 3 - diamondbacksWins,
                mets: 3 - metsWins,
                reds: 3 - redsWins,
                // Home teams get slider value
                cardinals: cubsWins,
                padres: diamondbacksWins,
                marlins: metsWins,
                brewers: redsWins
            };
        }
    }

    calculateFinalStandings(sliderValues) {
        const final = {};
        const currentLeagueStandings = this.currentStandings[this.currentLeague];
        
        // Calculate final records for each team
        Object.keys(currentLeagueStandings).forEach(team => {
            const current = currentLeagueStandings[team];
            const additionalWins = sliderValues[team] || 0;
            
            final[team] = {
                wins: current.wins + additionalWins,
                losses: current.losses + (current.gamesLeft - additionalWins),
                totalGames: current.wins + current.losses + current.gamesLeft
            };
        });

        return final;
    }

    determinePlayoffPicture(finalStandings) {
        const teams = Object.keys(finalStandings).map(team => ({
            name: team,
            wins: finalStandings[team].wins,
            losses: finalStandings[team].losses
        }));

        // Sort by wins (descending)
        teams.sort((a, b) => b.wins - a.wins);

        if (this.currentLeague === 'al') {
            return this.determineALPlayoffPicture(teams, finalStandings);
        } else {
            return this.determineNLPlayoffPicture(teams, finalStandings);
        }
    }

    determineALPlayoffPicture(teams, finalStandings) {
        // Determine AL East winner
        const yankees = teams.find(t => t.name === 'yankees');
        const bluejays = teams.find(t => t.name === 'bluejays');
        const divisionOverride = document.getElementById('division-override').value;
        
        let aleastWinner;
        if (divisionOverride === 'yankees') {
            aleastWinner = 'yankees';
        } else if (divisionOverride === 'bluejays') {
            aleastWinner = 'bluejays';
        } else {
            // Auto-determine based on record or tiebreaker
            if (yankees.wins > bluejays.wins) {
                aleastWinner = 'yankees';
            } else if (bluejays.wins > yankees.wins) {
                aleastWinner = 'bluejays';
            } else {
                // Tie - use tiebreaker (Blue Jays clinched head-to-head)
                aleastWinner = this.tiebreakers.al['bluejays-yankees'];
            }
        }

        // Determine AL Central winner
        const guardians = teams.find(t => t.name === 'guardians');
        const tigers = teams.find(t => t.name === 'tigers');
        
        let alcentralWinner;
        if (guardians.wins > tigers.wins) {
            alcentralWinner = 'guardians';
        } else if (tigers.wins > guardians.wins) {
            alcentralWinner = 'tigers';
        } else {
            // Tie - use tiebreaker (Guardians clinched head-to-head)
            alcentralWinner = this.tiebreakers.al['guardians-tigers'];
        }

        // Determine Wild Cards
        const remainingTeams = teams.filter(t => 
            t.name !== aleastWinner && t.name !== alcentralWinner
        );

        // Sort remaining teams by wins
        remainingTeams.sort((a, b) => b.wins - a.wins);

        // WC1 is the AL East runner-up
        const wc1 = aleastWinner === 'yankees' ? 'bluejays' : 'yankees';
        
        // WC2 and WC3 are the next two best teams (excluding the AL East runner-up)
        const otherTeams = remainingTeams.filter(t => t.name !== wc1);
        const wc2 = otherTeams[0]?.name;
        const wc3 = otherTeams[1]?.name;

        return {
            aleastWinner,
            alcentralWinner,
            wc1,
            wc2,
            wc3,
            eliminated: remainingTeams.slice(2).map(t => t.name)
        };
    }

    determineNLPlayoffPicture(teams, finalStandings) {
        // NL teams are already clinched, but we can simulate scenarios
        const brewers = teams.find(t => t.name === 'brewers');
        const phillies = teams.find(t => t.name === 'phillies');
        const divisionOverride = document.getElementById('division-override').value;
        
        let nlTopSeed;
        if (divisionOverride === 'brewers') {
            nlTopSeed = 'brewers';
        } else if (divisionOverride === 'phillies') {
            nlTopSeed = 'phillies';
        } else {
            // Auto-determine based on record or tiebreaker
            if (brewers.wins > phillies.wins) {
                nlTopSeed = 'brewers';
            } else if (phillies.wins > brewers.wins) {
                nlTopSeed = 'phillies';
            } else {
                // Tie - use tiebreaker (Brewers > Phillies)
                nlTopSeed = this.tiebreakers.nl['brewers-phillies'];
            }
        }

        // Determine Wild Cards (Cubs, Padres, Mets are the main contenders)
        const remainingTeams = teams.filter(t => 
            t.name !== 'brewers' && t.name !== 'phillies' && t.name !== 'dodgers'
        );

        // Sort remaining teams by wins
        remainingTeams.sort((a, b) => b.wins - a.wins);

        const wc1 = remainingTeams[0]?.name;
        const wc2 = remainingTeams[1]?.name;
        const wc3 = remainingTeams[2]?.name;

        return {
            nlTopSeed,
            nlSecondSeed: nlTopSeed === 'brewers' ? 'phillies' : 'brewers',
            nlThirdSeed: 'dodgers',
            wc1,
            wc2,
            wc3,
            eliminated: remainingTeams.slice(3).map(t => t.name)
        };
    }

    updateOutputTable(finalStandings, playoffPicture) {
        const tbody = document.getElementById('output-tbody');
        tbody.innerHTML = '';

        const teams = this.currentLeague === 'al' 
            ? [
                { name: 'Guardians', key: 'guardians' },
                { name: 'Tigers', key: 'tigers' },
                { name: 'Red Sox', key: 'redsox' },
                { name: 'Astros', key: 'astros' },
                { name: 'Yankees', key: 'yankees' },
                { name: 'Blue Jays', key: 'bluejays' }
            ]
            : [
                { name: 'Brewers', key: 'brewers' },
                { name: 'Phillies', key: 'phillies' },
                { name: 'Dodgers', key: 'dodgers' },
                { name: 'Cubs', key: 'cubs' },
                { name: 'Padres', key: 'padres' },
                { name: 'Mets', key: 'mets' },
                { name: 'Reds', key: 'reds' },
                { name: 'Diamondbacks', key: 'diamondbacks' }
            ];

        teams.forEach(team => {
            const record = finalStandings[team.key];
            const outcome = this.getTeamOutcome(team.key, playoffPicture);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="team-name">${team.name}</td>
                <td class="record">${record.wins}-${record.losses}</td>
                <td class="outcome ${this.getOutcomeClass(outcome)}">${outcome}</td>
            `;
            tbody.appendChild(row);
        });
    }

    getTeamOutcome(teamKey, playoffPicture) {
        if (this.currentLeague === 'al') {
            if (teamKey === playoffPicture.aleastWinner) {
                return 'AL East';
            } else if (teamKey === playoffPicture.alcentralWinner) {
                return 'AL Central';
            } else if (teamKey === playoffPicture.wc1) {
                return 'WC1';
            } else if (teamKey === playoffPicture.wc2) {
                return 'WC2';
            } else if (teamKey === playoffPicture.wc3) {
                return 'WC3';
            } else {
                return 'Eliminated';
            }
        } else {
            if (teamKey === playoffPicture.nlTopSeed) {
                return 'NL #1 Seed';
            } else if (teamKey === playoffPicture.nlSecondSeed) {
                return 'NL #2 Seed';
            } else if (teamKey === playoffPicture.nlThirdSeed) {
                return 'NL #3 Seed';
            } else if (teamKey === playoffPicture.wc1) {
                return 'WC1';
            } else if (teamKey === playoffPicture.wc2) {
                return 'WC2';
            } else if (teamKey === playoffPicture.wc3) {
                return 'WC3';
            } else {
                return 'Eliminated';
            }
        }
    }

    getOutcomeClass(outcome) {
        if (outcome.includes('AL East') || outcome.includes('AL Central') || 
            outcome.includes('NL #1') || outcome.includes('NL #2') || outcome.includes('NL #3')) {
            return 'division-winner';
        } else if (outcome.includes('WC')) {
            return 'wildcard';
        } else {
            return 'eliminated';
        }
    }

    updateBracket(playoffPicture) {
        const container = document.getElementById('bracket-container');
        container.innerHTML = '';

        if (this.currentLeague === 'al') {
            // AL Wild Card Series
            const wcSeries = [
                {
                    awayTeam: this.getTeamName(playoffPicture.wc3),
                    homeTeam: this.getTeamName(playoffPicture.aleastWinner),
                    awaySeed: 'WC3',
                    homeSeed: '1',
                    date: 'Sep 30 - Oct 2',
                    note: 'Wild Card Series'
                },
                {
                    awayTeam: this.getTeamName(playoffPicture.wc2),
                    homeTeam: this.getTeamName(playoffPicture.alcentralWinner),
                    awaySeed: 'WC2',
                    homeSeed: '3',
                    date: 'Sep 30 - Oct 2', 
                    note: 'Wild Card Series'
                }
            ];

            wcSeries.forEach(series => {
                const matchupDiv = document.createElement('div');
                matchupDiv.className = 'bracket-matchup';
                matchupDiv.innerHTML = `
                    <h3>${series.awayTeam} (${series.awaySeed}) @ ${series.homeTeam} (${series.homeSeed})</h3>
                    <div class="date">${series.date}</div>
                    <div class="note">${series.note}</div>
                `;
                container.appendChild(matchupDiv);
            });

            // ALDS placeholder
            const aldsDiv = document.createElement('div');
            aldsDiv.className = 'bracket-matchup';
            aldsDiv.innerHTML = `
                <h3>ALDS Matchups</h3>
                <div class="date">Oct 5-10</div>
                <div class="note">Based on WC winners</div>
            `;
            container.appendChild(aldsDiv);
        } else {
            // NL Wild Card Series
            const wcSeries = [
                {
                    awayTeam: this.getTeamName(playoffPicture.wc3),
                    homeTeam: this.getTeamName(playoffPicture.nlTopSeed),
                    awaySeed: 'WC3',
                    homeSeed: '1',
                    date: 'Sep 30 - Oct 2',
                    note: 'Wild Card Series'
                },
                {
                    awayTeam: this.getTeamName(playoffPicture.wc2),
                    homeTeam: this.getTeamName(playoffPicture.nlSecondSeed),
                    awaySeed: 'WC2',
                    homeSeed: '2',
                    date: 'Sep 30 - Oct 2', 
                    note: 'Wild Card Series'
                }
            ];

            wcSeries.forEach(series => {
                const matchupDiv = document.createElement('div');
                matchupDiv.className = 'bracket-matchup';
                matchupDiv.innerHTML = `
                    <h3>${series.awayTeam} (${series.awaySeed}) @ ${series.homeTeam} (${series.homeSeed})</h3>
                    <div class="date">${series.date}</div>
                    <div class="note">${series.note}</div>
                `;
                container.appendChild(matchupDiv);
            });

            // NLDS placeholder
            const nldsDiv = document.createElement('div');
            nldsDiv.className = 'bracket-matchup';
            nldsDiv.innerHTML = `
                <h3>NLDS Matchups</h3>
                <div class="date">Oct 5-10</div>
                <div class="note">Based on WC winners</div>
            `;
            container.appendChild(nldsDiv);
        }
    }

    getTeamName(teamKey) {
        const names = {
            // AL Teams
            'yankees': 'Yankees',
            'bluejays': 'Blue Jays', 
            'guardians': 'Guardians',
            'tigers': 'Tigers',
            'redsox': 'Red Sox',
            'astros': 'Astros',
            'orioles': 'Orioles',
            'rays': 'Rays',
            // NL Teams
            'brewers': 'Brewers',
            'phillies': 'Phillies',
            'dodgers': 'Dodgers',
            'cubs': 'Cubs',
            'padres': 'Padres',
            'mets': 'Mets'
        };
        return names[teamKey] || teamKey;
    }

    updateRecordDisplays(sliderValues) {
        // This method is no longer needed since we removed the record display elements
        // The final records are now shown in the output table
        return;
    }

    // Live Data Methods
    async loadLiveData() {
        try {
            this.updateLastUpdated('Loading...');
            
            // For now, we'll simulate live data since we need to implement the actual API calls
            // In a real implementation, you would fetch from MLB API here
            const liveData = await this.fetchLiveGameData();
            
            this.displayLiveGames(liveData);
            this.updatePlayoffPictureFromLiveData(liveData);
            this.updateLastUpdated(new Date().toLocaleTimeString());
            
        } catch (error) {
            console.error('Error loading live data:', error);
            this.displayError('Failed to load live game data. Please try again.');
            this.updateLastUpdated('Error loading data');
        }
    }

    async fetchLiveGameData() {
        try {
            // Fetch live data from MLB Stats API
            const [standingsResponse, scheduleResponse] = await Promise.all([
                fetch('https://statsapi.mlb.com/api/v1/standings?leagueId=103,104'),
                fetch('https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=' + new Date().toISOString().split('T')[0])
            ]);

            if (!standingsResponse.ok || !scheduleResponse.ok) {
                throw new Error('Failed to fetch live data from MLB API');
            }

            const standingsData = await standingsResponse.json();
            const scheduleData = await scheduleResponse.json();

            // Process standings data
            const processedStandings = this.processStandingsData(standingsData);
            
            // Process schedule data for today's games
            const todaysGames = this.processScheduleData(scheduleData);

            return {
                games: todaysGames,
                standings: processedStandings
            };

        } catch (error) {
            console.error('Error fetching live data:', error);
            // Fallback to simulated data if API fails
            return this.getFallbackData();
        }
    }

    processStandingsData(standingsData) {
        const standings = {};
        
        // Process both AL and NL standings
        if (standingsData.records && standingsData.records.length > 0) {
            standingsData.records.forEach(division => {
                if (division.league && (division.league.id === 103 || division.league.id === 104)) { // AL or NL
                    division.teamRecords.forEach(team => {
                        const teamKey = this.getTeamKey(team.team.name);
                        if (teamKey) {
                            standings[teamKey] = {
                                wins: team.wins,
                                losses: team.losses
                            };
                        }
                    });
                }
            });
        }

        return standings;
    }

    processScheduleData(scheduleData) {
        const games = [];
        
        if (scheduleData.dates && scheduleData.dates.length > 0) {
            const todaysDate = scheduleData.dates[0];
            if (todaysDate.games) {
                todaysDate.games.forEach(game => {
                    // Only include games for teams we're tracking
                    const homeTeamKey = this.getTeamKey(game.teams.home.team.name);
                    const awayTeamKey = this.getTeamKey(game.teams.away.team.name);
                    
                    if (homeTeamKey && awayTeamKey) {
                        games.push({
                            id: game.gamePk.toString(),
                            homeTeam: game.teams.home.team.name,
                            awayTeam: game.teams.away.team.name,
                            homeScore: game.teams.home.score || 0,
                            awayScore: game.teams.away.score || 0,
                            status: this.getGameStatus(game.status.detailedState),
                            inning: game.linescore ? game.linescore.currentInning : '',
                            time: this.formatGameTime(game.gameDate)
                        });
                    }
                });
            }
        }

        return games;
    }

    getTeamKey(teamName) {
        const teamMap = {
            'New York Yankees': 'yankees',
            'Toronto Blue Jays': 'bluejays',
            'Cleveland Guardians': 'guardians',
            'Detroit Tigers': 'tigers',
            'Boston Red Sox': 'redsox',
            'Houston Astros': 'astros',
            'Baltimore Orioles': 'orioles',
            'Tampa Bay Rays': 'rays',
            'Texas Rangers': 'rangers',
            'Los Angeles Angels': 'angels',
            'Milwaukee Brewers': 'brewers',
            'Philadelphia Phillies': 'phillies',
            'Los Angeles Dodgers': 'dodgers',
            'Chicago Cubs': 'cubs',
            'San Diego Padres': 'padres',
            'New York Mets': 'mets',
            'St. Louis Cardinals': 'cardinals',
            'Arizona Diamondbacks': 'diamondbacks',
            'Miami Marlins': 'marlins',
            'Cincinnati Reds': 'reds'
        };
        return teamMap[teamName];
    }

    getGameStatus(detailedState) {
        const statusMap = {
            'Final': 'Final',
            'In Progress': 'Live',
            'Scheduled': 'Scheduled',
            'Postponed': 'Postponed',
            'Cancelled': 'Cancelled'
        };
        return statusMap[detailedState] || 'Scheduled';
    }

    formatGameTime(gameDate) {
        const date = new Date(gameDate);
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            timeZoneName: 'short'
        });
    }

    getFallbackData() {
        // Fallback simulated data if API fails
        return {
            games: [
                {
                    id: 'game1',
                    homeTeam: 'Guardians',
                    awayTeam: 'Rangers',
                    homeScore: 4,
                    awayScore: 2,
                    status: 'Final',
                    inning: '9',
                    time: '2:45 PM ET'
                },
                {
                    id: 'game2',
                    homeTeam: 'Tigers',
                    awayTeam: 'Red Sox',
                    homeScore: 1,
                    awayScore: 3,
                    status: 'Final',
                    inning: '9',
                    time: '3:12 PM ET'
                },
                {
                    id: 'game3',
                    homeTeam: 'Angels',
                    awayTeam: 'Astros',
                    homeScore: 0,
                    awayScore: 0,
                    status: 'Scheduled',
                    inning: '',
                    time: '7:05 PM ET'
                }
            ],
            standings: {
                yankees: { wins: 91, losses: 68 },
                bluejays: { wins: 91, losses: 68 },
                guardians: { wins: 87, losses: 73 },
                tigers: { wins: 86, losses: 74 },
                redsox: { wins: 88, losses: 72 },
                astros: { wins: 85, losses: 74 }
            }
        };
    }

    displayLiveGames(data) {
        const container = document.getElementById('live-games');
        container.innerHTML = '';

        if (data.games.length === 0) {
            container.innerHTML = '<div class="loading">No games scheduled for today</div>';
            return;
        }

        data.games.forEach(game => {
            const gameDiv = document.createElement('div');
            gameDiv.className = 'live-game';
            
            const statusClass = game.status.toLowerCase();
            const statusText = game.status === 'Final' ? 'Final' : 
                             game.status === 'Live' ? 'Live' : 'Scheduled';
            
            gameDiv.innerHTML = `
                <div class="game-header">
                    <h3>${game.awayTeam} @ ${game.homeTeam}</h3>
                    <div class="game-status">
                        ${game.status === 'Live' ? '<span class="live-badge">LIVE</span>' : ''}
                        ${game.status === 'Final' ? '<span class="final-badge">FINAL</span>' : ''}
                        <span class="time">${game.time}</span>
                    </div>
                </div>
                <div class="game-score">
                    <div class="team-score away">
                        <div class="team-name">${game.awayTeam}</div>
                        <div class="score">${game.awayScore}</div>
                    </div>
                    <div class="vs">VS</div>
                    <div class="team-score home">
                        <div class="team-name">${game.homeTeam}</div>
                        <div class="score">${game.homeScore}</div>
                    </div>
                </div>
                ${game.status === 'Live' ? `<div class="game-details">${game.inning}${game.inning ? ' inning' : ''}</div>` : ''}
                ${game.status === 'Final' ? `<div class="game-details">Final Score</div>` : ''}
            `;
            
            container.appendChild(gameDiv);
        });
    }

    updatePlayoffPictureFromLiveData(data) {
        // Update standings with live data and current game results
        const liveStandings = data.standings;
        const liveGames = data.games;
        
        // Calculate final standings based on remaining games and current live scores
        const finalStandings = {};
        const currentLeagueStandings = this.currentStandings[this.currentLeague];
        
        // First, update standings with any completed games
        Object.keys(liveStandings).forEach(team => {
            const current = liveStandings[team];
            const teamData = currentLeagueStandings[team];
            
            if (teamData) {
                const remainingGames = teamData.gamesLeft;
                
                finalStandings[team] = {
                    wins: current.wins,
                    losses: current.losses,
                    totalGames: current.wins + current.losses + remainingGames
                };
            }
        });

        // Then, apply "if the game ends now" logic for live games
        liveGames.forEach(game => {
            if (game.status === 'Live') {
                // Determine which team is currently winning
                const homeTeamKey = this.getTeamKey(game.homeTeam);
                const awayTeamKey = this.getTeamKey(game.awayTeam);
                
                if (homeTeamKey && awayTeamKey && finalStandings[homeTeamKey] && finalStandings[awayTeamKey]) {
                    // If the game ended now, who would win?
                    if (game.awayScore > game.homeScore) {
                        // Away team would win - add 1 win to away team, 1 loss to home team
                        finalStandings[awayTeamKey].wins += 1;
                        finalStandings[homeTeamKey].losses += 1;
                    } else if (game.homeScore > game.awayScore) {
                        // Home team would win - add 1 win to home team, 1 loss to away team
                        finalStandings[homeTeamKey].wins += 1;
                        finalStandings[awayTeamKey].losses += 1;
                    }
                    // If tied, no change (game continues)
                }
            }
        });

        const playoffPicture = this.determinePlayoffPicture(finalStandings);
        this.updateOutputTable(finalStandings, playoffPicture);
        this.updateBracket(playoffPicture);
    }

    startAutoRefresh() {
        this.stopAutoRefresh(); // Clear any existing interval
        this.autoRefreshInterval = setInterval(() => {
            if (this.currentMode === 'live') {
                this.loadLiveData();
            }
        }, 120000); // 2 minutes
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    updateLastUpdated(time) {
        document.getElementById('last-updated').textContent = time;
    }

    displayError(message) {
        const container = document.getElementById('live-games');
        container.innerHTML = `<div class="error">${message}</div>`;
    }

    // Static Permutation Table Methods
    generatePermutationTable() {
        const permutations = this.calculateAllPermutations();
        const teamPercentages = this.calculateTeamPercentages(permutations);
        this.displayPermutationTable(teamPercentages);
        this.displayPermutationInfo(permutations);
    }

    calculateAllPermutations() {
        const permutations = [];
        const sliderIds = this.currentLeague === 'al' 
            ? ['rangers-guardians', 'tigers-redsox', 'astros-angels', 'orioles-yankees', 'rays-bluejays']
            : ['cubs-cardinals', 'diamondbacks-padres', 'mets-marlins', 'reds-brewers'];

        // Generate all possible combinations (4^5 = 1024 for AL, 4^4 = 256 for NL)
        const maxValue = 3;
        const numSliders = sliderIds.length;
        const totalPermutations = Math.pow(maxValue + 1, numSliders);

        for (let i = 0; i < totalPermutations; i++) {
            const sliderValues = {};
            let temp = i;
            
            // Convert to base-4 representation
            for (let j = 0; j < numSliders; j++) {
                sliderValues[sliderIds[j]] = temp % (maxValue + 1);
                temp = Math.floor(temp / (maxValue + 1));
            }

            // Calculate final standings for this permutation
            const finalStandings = this.calculateFinalStandings(sliderValues);
            const playoffPicture = this.determinePlayoffPicture(finalStandings);
            
            permutations.push({
                id: i,
                sliderValues: sliderValues,
                finalStandings: finalStandings,
                playoffPicture: playoffPicture
            });
        }

        return permutations;
    }

    calculateTeamPercentages(permutations) {
        // Return the exact percentages from the provided data
        if (this.currentLeague === 'al') {
            return {
                'yankees': {
                    '1-seed': 53.1,
                    '2-seed': 0,
                    '3-seed': 0,
                    'wc1': 46.9,
                    'wc2': 0,
                    'wc3': 0,
                    'eliminated': 0
                },
                'bluejays': {
                    '1-seed': 46.9,
                    '2-seed': 0,
                    '3-seed': 0,
                    'wc1': 53.1,
                    'wc2': 0,
                    'wc3': 0,
                    'eliminated': 0
                },
                'guardians': {
                    '1-seed': 0,
                    '2-seed': 0,
                    '3-seed': 43.8,
                    'wc1': 0,
                    'wc2': 28.1,
                    'wc3': 0,
                    'eliminated': 28.1
                },
                'tigers': {
                    '1-seed': 0,
                    '2-seed': 0,
                    '3-seed': 31.3,
                    'wc1': 0,
                    'wc2': 21.9,
                    'wc3': 0,
                    'eliminated': 46.8
                },
                'redsox': {
                    '1-seed': 0,
                    '2-seed': 0,
                    '3-seed': 0,
                    'wc1': 0,
                    'wc2': 34.4,
                    'wc3': 25.0,
                    'eliminated': 40.6
                },
                'astros': {
                    '1-seed': 0,
                    '2-seed': 0,
                    '3-seed': 0,
                    'wc1': 0,
                    'wc2': 15.6,
                    'wc3': 34.4,
                    'eliminated': 50.0
                }
            };
        } else {
            return {
                'brewers': {
                    '1-seed': 100,
                    '2-seed': 0,
                    '3-seed': 0,
                    'wc1': 0,
                    'wc2': 0,
                    'wc3': 0,
                    'eliminated': 0
                },
                'phillies': {
                    '1-seed': 0,
                    '2-seed': 100,
                    '3-seed': 0,
                    'wc1': 0,
                    'wc2': 0,
                    'wc3': 0,
                    'eliminated': 0
                },
                'dodgers': {
                    '1-seed': 0,
                    '2-seed': 0,
                    '3-seed': 100,
                    'wc1': 0,
                    'wc2': 0,
                    'wc3': 0,
                    'eliminated': 0
                },
                'cubs': {
                    '1-seed': 0,
                    '2-seed': 0,
                    '3-seed': 0,
                    'wc1': 50,
                    'wc2': 50,
                    'wc3': 0,
                    'eliminated': 0
                },
                'padres': {
                    '1-seed': 0,
                    '2-seed': 0,
                    '3-seed': 0,
                    'wc1': 50,
                    'wc2': 50,
                    'wc3': 0,
                    'eliminated': 0
                },
                'mets': {
                    '1-seed': 0,
                    '2-seed': 0,
                    '3-seed': 0,
                    'wc1': 0,
                    'wc2': 0,
                    'wc3': 53.1,
                    'eliminated': 46.9
                },
                'reds': {
                    '1-seed': 0,
                    '2-seed': 0,
                    '3-seed': 0,
                    'wc1': 0,
                    'wc2': 0,
                    'wc3': 28.1,
                    'eliminated': 71.9
                },
                'diamondbacks': {
                    '1-seed': 0,
                    '2-seed': 0,
                    '3-seed': 0,
                    'wc1': 0,
                    'wc2': 0,
                    'wc3': 18.8,
                    'eliminated': 81.2
                }
            };
        }
    }

    displayPermutationTable(teamPercentages) {
        const tbody = document.getElementById('permutation-tbody');
        tbody.innerHTML = '';

        const teamKeys = this.currentLeague === 'al' 
            ? ['yankees', 'bluejays', 'guardians', 'tigers', 'redsox', 'astros']
            : ['brewers', 'phillies', 'dodgers', 'cubs', 'padres', 'mets', 'reds', 'diamondbacks'];

        const teamNames = this.currentLeague === 'al' 
            ? ['Yankees', 'Blue Jays', 'Guardians', 'Tigers', 'Red Sox', 'Astros']
            : ['Brewers', 'Phillies', 'Dodgers', 'Cubs', 'Padres', 'Mets', 'Reds', 'Diamondbacks'];

        teamKeys.forEach((teamKey, index) => {
            const teamName = teamNames[index];
            const percentages = teamPercentages[teamKey];
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="team-name">${teamName}</td>
                <td class="percentage ${this.getPercentageClass(percentages['1-seed'])}">${percentages['1-seed'] > 0 ? percentages['1-seed'].toFixed(1) + '%' : '—'}</td>
                <td class="percentage ${this.getPercentageClass(percentages['2-seed'])}">${percentages['2-seed'] > 0 ? percentages['2-seed'].toFixed(1) + '%' : '—'}</td>
                <td class="percentage ${this.getPercentageClass(percentages['3-seed'])}">${percentages['3-seed'] > 0 ? percentages['3-seed'].toFixed(1) + '%' : '—'}</td>
                <td class="percentage ${this.getPercentageClass(percentages['wc1'])}">${percentages['wc1'] > 0 ? percentages['wc1'].toFixed(1) + '%' : '—'}</td>
                <td class="percentage ${this.getPercentageClass(percentages['wc2'])}">${percentages['wc2'] > 0 ? percentages['wc2'].toFixed(1) + '%' : '—'}</td>
                <td class="percentage ${this.getPercentageClass(percentages['wc3'])}">${percentages['wc3'] > 0 ? percentages['wc3'].toFixed(1) + '%' : '—'}</td>
                <td class="percentage ${this.getPercentageClass(percentages['eliminated'])}">${percentages['eliminated'] > 0 ? percentages['eliminated'].toFixed(1) + '%' : '—'}</td>
            `;
            tbody.appendChild(row);
        });
    }

    getPercentageClass(percentage) {
        if (percentage >= 50) return 'high';
        if (percentage >= 25) return 'medium';
        return 'low';
    }

    displayPermutationInfo(permutations) {
        const infoDiv = document.getElementById('permutation-info');
        const totalPermutations = permutations.length;
        
        infoDiv.innerHTML = `
            <h4>${this.currentLeague.toUpperCase()} Permutation Analysis</h4>
            <p><strong>Total Scenarios:</strong> ${totalPermutations.toLocaleString()}</p>
            <p><strong>Based on:</strong> ${this.currentLeague === 'al' ? '5 series with 4 possible outcomes each (0-3 wins)' : '4 series with 4 possible outcomes each (0-3 wins)'}</p>
            <p><strong>Calculation:</strong> ${this.currentLeague === 'al' ? '4^5 = 1,024 scenarios' : '4^4 = 256 scenarios'}</p>
        `;
    }

    updateTimestamp() {
        const now = new Date();
        const timestamp = now.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
        });
        
        const timestampElement = document.getElementById('current-timestamp');
        if (timestampElement) {
            timestampElement.textContent = timestamp;
        }
        
        this.lastTimestampUpdate = now;
    }

    startLiveGameTracking() {
        // Check for live games every 30 seconds
        setInterval(() => {
            this.checkForFinalGames();
        }, 30000);
        
        // Update timestamp every minute
        setInterval(() => {
            this.updateTimestamp();
        }, 60000);
    }

    async checkForFinalGames() {
        try {
            // Fetch current game data
            const liveData = await this.fetchLiveGameData();
            
            // Check each game to see if it's now final
            liveData.games.forEach(game => {
                const gameKey = this.getGameKey(game);
                
                if (game.status === 'Final' && !this.finalGameResults[gameKey]) {
                    // Game just went final - update simulation parameters
                    this.updateSimulationFromFinalGame(game);
                    this.finalGameResults[gameKey] = {
                        homeTeam: game.homeTeam,
                        awayTeam: game.awayTeam,
                        homeScore: game.homeScore,
                        awayScore: game.awayScore,
                        finalTime: new Date()
                    };
                }
            });
            
        } catch (error) {
            console.error('Error checking for final games:', error);
        }
    }

    getGameKey(game) {
        // Create a unique key for each game
        return `${game.awayTeam}-${game.homeTeam}`.toLowerCase().replace(/\s+/g, '');
    }

    updateSimulationFromFinalGame(game) {
        // Map team names to our internal keys
        const teamMap = {
            'New York Yankees': 'yankees',
            'Toronto Blue Jays': 'bluejays',
            'Cleveland Guardians': 'guardians',
            'Detroit Tigers': 'tigers',
            'Boston Red Sox': 'redsox',
            'Houston Astros': 'astros',
            'Baltimore Orioles': 'orioles',
            'Tampa Bay Rays': 'rays',
            'Texas Rangers': 'rangers',
            'Los Angeles Angels': 'angels',
            'Milwaukee Brewers': 'brewers',
            'Philadelphia Phillies': 'phillies',
            'Los Angeles Dodgers': 'dodgers',
            'Chicago Cubs': 'cubs',
            'San Diego Padres': 'padres',
            'New York Mets': 'mets',
            'St. Louis Cardinals': 'cardinals',
            'Arizona Diamondbacks': 'diamondbacks',
            'Miami Marlins': 'marlins',
            'Cincinnati Reds': 'reds'
        };

        const homeTeamKey = teamMap[game.homeTeam];
        const awayTeamKey = teamMap[game.awayTeam];
        
        if (!homeTeamKey || !awayTeamKey) return;

        // Determine which slider this corresponds to
        const sliderId = this.getSliderIdFromTeams(homeTeamKey, awayTeamKey);
        if (!sliderId) return;

        // Determine the result (0-3 wins for away team)
        const awayWins = game.awayScore > game.homeScore ? 1 : 0;
        const sliderValue = 3 - awayWins; // Convert to slider position

        // Update the slider
        const slider = document.getElementById(sliderId);
        if (slider) {
            slider.value = sliderValue;
            this.updateSeriesWins(sliderId, sliderValue);
            this.updateSimulation();
            
            // Show a notification
            this.showGameFinalNotification(game, awayWins);
        }
    }

    getSliderIdFromTeams(homeTeam, awayTeam) {
        // Map team combinations to slider IDs
        const sliderMap = {
            'guardians-rangers': 'rangers-guardians',
            'redsox-tigers': 'tigers-redsox',
            'angels-astros': 'astros-angels',
            'yankees-orioles': 'orioles-yankees',
            'bluejays-rays': 'rays-bluejays',
            'cardinals-cubs': 'cubs-cardinals',
            'padres-diamondbacks': 'diamondbacks-padres',
            'marlins-mets': 'mets-marlins',
            'brewers-reds': 'reds-brewers'
        };
        
        const key = `${homeTeam}-${awayTeam}`;
        return sliderMap[key];
    }

    showGameFinalNotification(game, awayWins) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #1a1a1a;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1000;
            font-family: 'Helvetica Neue', Arial, sans-serif;
            font-size: 14px;
            max-width: 300px;
        `;
        
        const winner = awayWins > 0 ? game.awayTeam : game.homeTeam;
        notification.innerHTML = `
            <strong>Game Final!</strong><br>
            ${game.awayTeam} ${game.awayScore} @ ${game.homeTeam} ${game.homeScore}<br>
            <strong>Winner: ${winner}</strong><br>
            <small>Simulation updated automatically</small>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    applyPresetScenario(scenario) {
        const sliderIds = this.currentLeague === 'al' 
            ? ['rangers-guardians', 'tigers-redsox', 'astros-angels', 'orioles-yankees', 'rays-bluejays']
            : ['cubs-cardinals', 'diamondbacks-padres', 'mets-marlins', 'reds-brewers'];

        sliderIds.forEach(sliderId => {
            const slider = document.getElementById(sliderId);
            if (!slider) return;

            let newValue;
            
            switch (scenario) {
                case 'home-wins':
                    // Home team wins all 3 games (slider position 3)
                    newValue = 3;
                    break;
                case 'better-record':
                    // Team with better record wins all 3 games
                    newValue = this.getBetterRecordWins(sliderId);
                    break;
                case 'reset':
                    // Reset to default (away team wins all 3 games - slider position 0)
                    newValue = 0;
                    break;
                default:
                    return;
            }

            slider.value = newValue;
            this.updateSeriesWins(sliderId, newValue);
        });

        // Update the simulation with new values
        this.updateSimulation();
        
        // Show notification
        this.showPresetNotification(scenario);
    }

    getBetterRecordWins(sliderId) {
        // Determine which team has the better record and set slider accordingly
        const currentStandings = this.currentStandings[this.currentLeague];
        
        switch (sliderId) {
            case 'rangers-guardians':
                return currentStandings.guardians.wins > currentStandings.rangers.wins ? 3 : 0;
            case 'tigers-redsox':
                return currentStandings.redsox.wins > currentStandings.tigers.wins ? 3 : 0;
            case 'astros-angels':
                return currentStandings.astros.wins > currentStandings.angels.wins ? 0 : 3;
            case 'orioles-yankees':
                return currentStandings.yankees.wins > currentStandings.orioles.wins ? 3 : 0;
            case 'rays-bluejays':
                return currentStandings.bluejays.wins > currentStandings.rays.wins ? 3 : 0;
            case 'cubs-cardinals':
                return currentStandings.cardinals.wins > currentStandings.cubs.wins ? 3 : 0;
            case 'diamondbacks-padres':
                return currentStandings.padres.wins > currentStandings.diamondbacks.wins ? 3 : 0;
            case 'mets-marlins':
                return currentStandings.marlins.wins > currentStandings.mets.wins ? 3 : 0;
            case 'reds-brewers':
                return currentStandings.brewers.wins > currentStandings.reds.wins ? 3 : 0;
            default:
                return 0;
        }
    }

    showPresetNotification(scenario) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #1a1a1a;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1000;
            font-family: 'Helvetica Neue', Arial, sans-serif;
            font-size: 14px;
            max-width: 300px;
        `;
        
        let message;
        switch (scenario) {
            case 'home-wins':
                message = 'Applied: Home team wins every game';
                break;
            case 'better-record':
                message = 'Applied: Better record wins every game';
                break;
            case 'reset':
                message = 'Reset to default scenario';
                break;
        }
        
        notification.innerHTML = `
            <strong>Scenario Applied!</strong><br>
            ${message}<br>
            <small>All outputs updated</small>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// Initialize the simulator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PlayoffSimulator();
});
