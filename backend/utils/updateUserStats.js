import User from '../models/User.js';

/**
 * Update user statistics after a game session is completed
 * @param {Object} playerResult - Player result from game session
 * @param {number} playerResult.score - Points scored
 * @param {boolean} playerResult.isWinner - Whether player won
 * @param {number} playerResult.correctAnswers - Number of correct answers
 * @param {number} playerResult.totalAttempted - Total questions attempted
 * @param {string} userId - User ID to update
 */
export async function updateUserStatsAfterGame(playerResult, userId) {
  try {
    if (!userId) return;

    const user = await User.findById(userId);
    if (!user) return;

    // Update statistics
    user.totalGamesPlayed = (user.totalGamesPlayed || 0) + 1;
    user.totalScore = (user.totalScore || 0) + (playerResult.score || 0);
    user.bestScore = Math.max(user.bestScore || 0, playerResult.score || 0);
    
    if (playerResult.isWinner) {
      user.gamesWon = (user.gamesWon || 0) + 1;
    }

    // Calculate accuracy
    if (playerResult.totalAttempted > 0) {
      const accuracy = Math.round(
        ((playerResult.correctAnswers || 0) / playerResult.totalAttempted) * 100
      );
      
      // Update overall accuracy (weighted average)
      const totalAttempts = (user.totalGamesPlayed || 1) * 10; // Assuming avg 10 questions per game
      user.accuracy = Math.round(
        ((user.accuracy * (totalAttempts - playerResult.totalAttempted)) + 
         (accuracy * playerResult.totalAttempted)) / totalAttempts
      );
    }

    await user.save();
    console.log(`✅ Updated stats for user ${user.username}: Games: ${user.totalGamesPlayed}, Best: ${user.bestScore}`);
  } catch (err) {
    console.warn('⚠️  Could not update user stats:', err.message);
  }
}

/**
 * Get user leaderboard by score
 */
export async function getUserLeaderboard(limit = 10) {
  try {
    return await User.find()
      .select('username avatar bestScore totalGamesPlayed accuracy gamesWon totalScore')
      .sort({ bestScore: -1 })
      .limit(limit);
  } catch (err) {
    console.warn('⚠️  Could not fetch leaderboard:', err.message);
    return [];
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(userId) {
  try {
    return await User.findById(userId)
      .select('username avatar totalGamesPlayed totalScore bestScore accuracy gamesWon')
      .exec();
  } catch (err) {
    console.warn('⚠️  Could not fetch user stats:', err.message);
    return null;
  }
}
