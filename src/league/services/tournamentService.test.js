const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const TournamentService = require('../services/TournamentService');
const { TOURNAMENT_STATUS } = require('../constants/tournamentStatus');

describe('TournamentService guards', () => {
    it('assertTournamentMatchCorrectable locks completed tournaments', () => {
        assert.throws(() => {
            TournamentService.assertTournamentMatchCorrectable(
                { tournamentId: 't1', groupId: 'A' },
                { status: TOURNAMENT_STATUS.COMPLETED },
            );
        }, (err) => err.code === 'CL_KNOCKOUT_LOCKED');
    });

    it('assertTournamentMatchCorrectable locks group edits after knockout starts', () => {
        assert.throws(() => {
            TournamentService.assertTournamentMatchCorrectable(
                { tournamentId: 't1', groupId: 'A' },
                { status: TOURNAMENT_STATUS.KNOCKOUT, currentKnockoutRound: 'qf' },
            );
        }, (err) => err.code === 'CL_KNOCKOUT_LOCKED');
    });

    it('assertTournamentMatchCorrectable locks earlier knockout rounds', () => {
        assert.throws(() => {
            TournamentService.assertTournamentMatchCorrectable(
                { tournamentId: 't1', knockoutRound: 'r16' },
                { status: TOURNAMENT_STATUS.KNOCKOUT, currentKnockoutRound: 'qf' },
            );
        }, (err) => err.code === 'CL_KNOCKOUT_LOCKED');
    });

    it('assertTournamentReadable throws CL_NO_TOURNAMENT when season completed', () => {
        assert.throws(() => {
            TournamentService.assertTournamentReadable(
                { championsLeague: { enabled: true }, status: 'completed' },
                null,
            );
        }, (err) => err.code === 'CL_NO_TOURNAMENT');
    });
});
