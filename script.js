// AL Playoff Permutation Simulator
class PlayoffSimulator {
    constructor() {
        this.currentMode = 'simulation';
        this.autoRefreshInterval = null;
        this.lastUpdateTime = null;
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
                rays: { wins: 77, losses: 82, gamesLeft: 3 }
            },
            // National League
            nl: {
                brewers: { wins: 96, losses: 63, gamesLeft: 3 },
                phillies: { wins: 94, losses: 65, gamesLeft: 3 },
                dodgers: { wins: 90, losses: 69, gamesLeft: 3 },
                cubs: { wins: 89, losses: 70, gamesLeft: 3 },
                padres: { wins: 87, losses: 72, gamesLeft: 3 },
                mets: { wins: 82, losses: 77, gamesLeft: 3 }
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

        this.initializeEventListeners();
        this.initializeOverallRecords();
        this.updateSimulation();
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

    updateSeriesWins(sliderId, awayWins) {
        const awayWinsInt = parseInt(awayWins);
        const homeWins = 3 - awayWinsInt;
        
        switch(sliderId) {
            case 'rangers-guardians':
                document.getElementById('rangers-wins').textContent = awayWinsInt;
                document.getElementById('guardians-wins').textContent = homeWins;
                this.updateOverallRecord('rangers', awayWinsInt);
                this.updateOverallRecord('guardians', homeWins);
                break;
            case 'tigers-redsox':
                document.getElementById('tigers-wins').textContent = awayWinsInt;
                document.getElementById('redsox-wins').textContent = homeWins;
                this.updateOverallRecord('tigers', awayWinsInt);
                this.updateOverallRecord('redsox', homeWins);
                break;
            case 'astros-angels':
                document.getElementById('astros-wins').textContent = awayWinsInt;
                document.getElementById('angels-wins').textContent = homeWins;
                this.updateOverallRecord('astros', awayWinsInt);
                this.updateOverallRecord('angels', homeWins);
                break;
            case 'orioles-yankees':
                document.getElementById('orioles-wins').textContent = awayWinsInt;
                document.getElementById('yankees-wins').textContent = homeWins;
                this.updateOverallRecord('orioles', awayWinsInt);
                this.updateOverallRecord('yankees', homeWins);
                break;
            case 'rays-bluejays':
                document.getElementById('rays-wins').textContent = awayWinsInt;
                document.getElementById('bluejays-wins').textContent = homeWins;
                this.updateOverallRecord('rays', awayWinsInt);
                this.updateOverallRecord('bluejays', homeWins);
                break;
            case 'cubs-cardinals':
                document.getElementById('cubs-wins').textContent = awayWinsInt;
                document.getElementById('cardinals-wins').textContent = homeWins;
                this.updateOverallRecord('cubs', awayWinsInt);
                this.updateOverallRecord('cardinals', homeWins);
                break;
            case 'diamondbacks-padres':
                document.getElementById('diamondbacks-wins').textContent = awayWinsInt;
                document.getElementById('padres-wins').textContent = homeWins;
                this.updateOverallRecord('diamondbacks', awayWinsInt);
                this.updateOverallRecord('padres', homeWins);
                break;
            case 'mets-marlins':
                document.getElementById('mets-wins').textContent = awayWinsInt;
                document.getElementById('marlins-wins').textContent = homeWins;
                this.updateOverallRecord('mets', awayWinsInt);
                this.updateOverallRecord('marlins', homeWins);
                break;
            case 'reds-brewers':
                document.getElementById('reds-wins').textContent = awayWinsInt;
                document.getElementById('brewers-wins').textContent = homeWins;
                this.updateOverallRecord('reds', awayWinsInt);
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
            outputSubtitle.textContent = 'Updates with live game results:';
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
            // Get away team wins from sliders, calculate home team wins
            const rangersWins = parseInt(document.getElementById('rangers-guardians').value);
            const tigersWins = parseInt(document.getElementById('tigers-redsox').value);
            const astrosWins = parseInt(document.getElementById('astros-angels').value);
            const oriolesWins = parseInt(document.getElementById('orioles-yankees').value);
            const raysWins = parseInt(document.getElementById('rays-bluejays').value);
            
            return {
                // Away teams get their slider value
                rangers: rangersWins,
                tigers: tigersWins,
                astros: astrosWins,
                orioles: oriolesWins,
                rays: raysWins,
                // Home teams get 3 minus away team wins
                guardians: 3 - rangersWins,
                redsox: 3 - tigersWins,
                angels: 3 - astrosWins,
                yankees: 3 - oriolesWins,
                bluejays: 3 - raysWins
            };
        } else {
            // Get away team wins from sliders, calculate home team wins
            const cubsWins = parseInt(document.getElementById('cubs-cardinals').value);
            const diamondbacksWins = parseInt(document.getElementById('diamondbacks-padres').value);
            const metsWins = parseInt(document.getElementById('mets-marlins').value);
            const redsWins = parseInt(document.getElementById('reds-brewers').value);
            
            return {
                // Away teams get their slider value
                cubs: cubsWins,
                diamondbacks: diamondbacksWins,
                mets: metsWins,
                reds: redsWins,
                // Home teams get 3 minus away team wins
                cardinals: 3 - cubsWins,
                padres: 3 - diamondbacksWins,
                marlins: 3 - metsWins,
                brewers: 3 - redsWins
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
        
        // WC2 and WC3 are the next two best teams
        const wc2 = remainingTeams[0]?.name;
        const wc3 = remainingTeams[1]?.name;

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
                { name: 'Mets', key: 'mets' }
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
                    matchup: `${this.getTeamName(playoffPicture.aleastWinner)} vs ${this.getTeamName(playoffPicture.wc3)}`,
                    date: 'Oct 1-3',
                    note: 'Wild Card Series'
                },
                {
                    matchup: `${this.getTeamName(playoffPicture.alcentralWinner)} vs ${this.getTeamName(playoffPicture.wc2)}`,
                    date: 'Oct 1-3', 
                    note: 'Wild Card Series'
                }
            ];

            wcSeries.forEach(series => {
                const matchupDiv = document.createElement('div');
                matchupDiv.className = 'bracket-matchup';
                matchupDiv.innerHTML = `
                    <h3>${series.matchup}</h3>
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
                    matchup: `${this.getTeamName(playoffPicture.nlTopSeed)} vs ${this.getTeamName(playoffPicture.wc3)}`,
                    date: 'Oct 1-3',
                    note: 'Wild Card Series'
                },
                {
                    matchup: `${this.getTeamName(playoffPicture.nlSecondSeed)} vs ${this.getTeamName(playoffPicture.wc2)}`,
                    date: 'Oct 1-3', 
                    note: 'Wild Card Series'
                }
            ];

            wcSeries.forEach(series => {
                const matchupDiv = document.createElement('div');
                matchupDiv.className = 'bracket-matchup';
                matchupDiv.innerHTML = `
                    <h3>${series.matchup}</h3>
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
        }
    }

    async fetchLiveGameData() {
        // Simulated live data - replace with actual MLB API calls
        // For demonstration, we'll return mock data that represents current games
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
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
                        guardians: { wins: 87, losses: 73 }, // +1 win from game
                        tigers: { wins: 86, losses: 74 }, // +1 loss from game
                        redsox: { wins: 88, losses: 72 }, // +1 win from game
                        astros: { wins: 85, losses: 74 }
                    }
                });
            }, 1000);
        });
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
                <h3>${game.awayTeam} @ ${game.homeTeam}</h3>
                <div class="game-status">
                    <span class="status ${statusClass}">${statusText}</span>
                    <span class="time">${game.time}</span>
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
                ${game.status === 'Live' ? `<div class="game-details">${game.inning} inning</div>` : ''}
            `;
            
            container.appendChild(gameDiv);
        });
    }

    updatePlayoffPictureFromLiveData(data) {
        // Update standings with live data
        const liveStandings = data.standings;
        
        // Calculate final standings based on remaining games
        const finalStandings = {};
        Object.keys(liveStandings).forEach(team => {
            const current = liveStandings[team];
            const remainingGames = this.currentStandings[team].gamesLeft;
            
            finalStandings[team] = {
                wins: current.wins,
                losses: current.losses,
                totalGames: current.wins + current.losses + remainingGames
            };
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
}

// Initialize the simulator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PlayoffSimulator();
});
