/**
 * Adaptive FIFA-style Champions League format resolver.
 * Maps qualified team count (2–16) to tournament structure.
 *
 * @param {number} teamCount
 */
function resolveFormat(teamCount) {
    if (!Number.isInteger(teamCount) || teamCount < 2 || teamCount > 16) {
        throw new Error(`Invalid team count for format resolver: ${teamCount}`);
    }

    if (teamCount === 2) {
        return {
            templateId: 'final_only',
            groupCount: 0,
            teamsPerGroup: 0,
            knockoutSize: 2,
            qualifiersPerGroup: 0,
            skipGroupStage: true,
            initialKnockoutRound: 'final',
            knockoutOnly: true,
        };
    }

    if (teamCount === 3) {
        return {
            templateId: 'playoff_final',
            groupCount: 0,
            teamsPerGroup: 0,
            knockoutSize: 3,
            qualifiersPerGroup: 0,
            skipGroupStage: true,
            initialKnockoutRound: 'playoff',
            knockoutOnly: true,
            playoffStructure: 'seed1_bye',
        };
    }

    if (teamCount === 4) {
        return {
            templateId: 'single_group_4',
            groupCount: 1,
            teamsPerGroup: 4,
            knockoutSize: 2,
            qualifiersPerGroup: 2,
            skipGroupStage: false,
            initialKnockoutRound: 'final',
        };
    }

    if (teamCount <= 7) {
        const groupCount = 2;
        const teamsPerGroup = Math.ceil(teamCount / groupCount);

        return {
            templateId: 'dual_group_small',
            groupCount,
            teamsPerGroup,
            knockoutSize: groupCount * 2,
            qualifiersPerGroup: 2,
            skipGroupStage: false,
            initialKnockoutRound: knockoutRoundForSize(groupCount * 2),
        };
    }

    if (teamCount === 8) {
        return {
            templateId: 'dual_group_8',
            groupCount: 2,
            teamsPerGroup: 4,
            knockoutSize: 4,
            qualifiersPerGroup: 2,
            skipGroupStage: false,
            initialKnockoutRound: 'sf',
        };
    }

    if (teamCount <= 12) {
        const groupCount = 3;
        const teamsPerGroup = Math.ceil(teamCount / groupCount);

        return {
            templateId: 'triple_group',
            groupCount,
            teamsPerGroup,
            knockoutSize: Math.min(8, groupCount * 2),
            qualifiersPerGroup: 2,
            skipGroupStage: false,
            initialKnockoutRound: knockoutRoundForSize(Math.min(8, groupCount * 2)),
            useBestThirds: teamCount > groupCount * 2,
        };
    }

    return {
        templateId: 'quad_group_16',
        groupCount: 4,
        teamsPerGroup: 4,
        knockoutSize: 8,
        qualifiersPerGroup: 2,
        skipGroupStage: false,
        initialKnockoutRound: 'qf',
    };
}

/**
 * @param {number} size
 */
function knockoutRoundForSize(size) {
    if (size <= 2) return 'final';
    if (size <= 4) return 'sf';
    if (size <= 8) return 'qf';
    return 'r16';
}

/**
 * Distribute teams into balanced groups.
 *
 * @param {object[]} qualifiedTeams sorted by seed ascending
 * @param {number} groupCount
 */
function distributeTeamsIntoGroups(qualifiedTeams, groupCount) {
    const groupLabels = 'ABCDEFGHIJKLMNOP'.split('').slice(0, groupCount);
    /** @type {{ id: string, teamIds: string[] }[]} */
    const groups = groupLabels.map((id) => ({ id, teamIds: [] }));

    for (let i = 0; i < qualifiedTeams.length; i++) {
        const groupIndex = i % groupCount;
        groups[groupIndex].teamIds.push(qualifiedTeams[i].teamId.toString());
    }

    return groups;
}

/**
 * Seeded pot draw — snake distribution for balanced groups.
 *
 * @param {object[]} qualifiedTeams sorted by league rank
 * @param {number} groupCount
 */
function seededGroupDraw(qualifiedTeams, groupCount) {
    const sorted = [...qualifiedTeams].sort((a, b) => a.seed - b.seed);
    const groupLabels = 'ABCDEFGHIJKLMNOP'.split('').slice(0, groupCount);
    /** @type {{ id: string, teamIds: string[] }[]} */
    const groups = groupLabels.map((id) => ({ id, teamIds: [] }));

    let direction = 1;
    let groupIndex = 0;

    for (const team of sorted) {
        groups[groupIndex].teamIds.push(team.teamId.toString());

        if (groupCount <= 1) {
            continue;
        }

        groupIndex += direction;

        if (groupIndex >= groupCount) {
            groupIndex = groupCount - 1;
            direction = -1;
        } else if (groupIndex < 0) {
            groupIndex = 0;
            direction = 1;
        }
    }

    return groups;
}

/**
 * Round up to next power of 2.
 *
 * @param {number} n
 */
function nextPowerOfTwo(n) {
    let p = 1;

    while (p < n) {
        p *= 2;
    }

    return p;
}

module.exports = {
    resolveFormat,
    distributeTeamsIntoGroups,
    seededGroupDraw,
    knockoutRoundForSize,
    nextPowerOfTwo,
};
