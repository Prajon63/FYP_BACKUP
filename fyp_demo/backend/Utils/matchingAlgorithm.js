/**
 * Matchmaking Algorithm
 * 
 * Calculates compatibility scores between users based on:
 * - Basic preferences (age, gender, location)
 * - Shared interests
 * - Lifestyle compatibility
 * - Profile completeness
 * - Activity level
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees) => degrees * (Math.PI / 180);

/**
 * Calculate age compatibility score
 * @param {number} userAge - Current user's age
 * @param {number} targetAge - Target user's age
 * @param {object} preferences - User's age preferences
 * @returns {number} Score from 0-100
 */
export const calculateAgeScore = (userAge, targetAge, preferences) => {
  // If the target user has no age stored, return a neutral score rather than NaN.
  // NaN propagates into the total score and makes score >= 0 return false, which
  // silently filters out users with incomplete profiles.
  if (targetAge === undefined || targetAge === null) return 50;

  const { min = 18, max = 100 } = preferences.ageRange || {};

  // Check if target age is within preferred range
  if (targetAge < min || targetAge > max) {
    return 0;
  }

  // Calculate how close the age is to the middle of the range
  const midPoint = (min + max) / 2;
  const range = max - min;
  const distance = Math.abs(targetAge - midPoint);

  // Score decreases as age moves away from midpoint
  const score = 100 - ((distance / (range / 2)) * 30);

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate distance/location compatibility score
 * @param {object} userLocation - Current user's location
 * @param {object} targetLocation - Target user's location
 * @param {number} maxDistance - Maximum preferred distance in km
 * @returns {number} Score from 0-100
 */
export const calculateLocationScore = (userLocation, targetLocation, maxDistance = 50) => {
  if (!userLocation?.coordinates || !targetLocation?.coordinates) {
    return 50; // Neutral score if location not available
  }

  const [lon1, lat1] = userLocation.coordinates;
  const [lon2, lat2] = targetLocation.coordinates;

  // If either user has default [0,0] coordinates (no real location set), return neutral
  const userHasRealLocation = !(lon1 === 0 && lat1 === 0);
  const targetHasRealLocation = !(lon2 === 0 && lat2 === 0);
  if (!userHasRealLocation || !targetHasRealLocation) {
    return 50;
  }

  const distance = calculateDistance(lat1, lon1, lat2, lon2);

  // Return 50 (neutral) if beyond max distance, so they still appear but ranked lower
  if (distance > maxDistance) {
    return 50;
  }

  // Score decreases linearly with distance
  const score = 100 - ((distance / maxDistance) * 100);

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate interests compatibility score
 * @param {string[]} userInterests - Current user's interests
 * @param {string[]} targetInterests - Target user's interests
 * @returns {number} Score from 0-100
 */
export const calculateInterestsScore = (userInterests = [], targetInterests = []) => {
  if (!userInterests.length || !targetInterests.length) {
    return 30; // Low but not zero score
  }

  // Find common interests (case-insensitive)
  const normalizedUserInterests = userInterests.map(i => i.toLowerCase());
  const normalizedTargetInterests = targetInterests.map(i => i.toLowerCase());

  const commonInterests = normalizedUserInterests.filter(interest =>
    normalizedTargetInterests.includes(interest)
  );

  // Calculate Jaccard similarity
  const union = new Set([...normalizedUserInterests, ...normalizedTargetInterests]);
  const jaccardScore = (commonInterests.length / union.size) * 100;

  // Bonus for having many common interests
  const bonusMultiplier = 1 + (commonInterests.length * 0.05);

  return Math.min(100, jaccardScore * bonusMultiplier);
};

/**
 * Calculate lifestyle compatibility score
 * @param {object} userLifestyle - Current user's lifestyle
 * @param {object} targetLifestyle - Target user's lifestyle
 * @returns {number} Score from 0-100
 */
export const calculateLifestyleScore = (userLifestyle = {}, targetLifestyle = {}) => {
  const factors = ['smoking', 'drinking', 'exercise', 'diet'];
  let totalScore = 0;
  let validFactors = 0;

  factors.forEach(factor => {
    const userValue = userLifestyle[factor];
    const targetValue = targetLifestyle[factor];

    // Skip if either value is missing or "Prefer not to say"
    if (!userValue || !targetValue ||
      userValue === 'Prefer not to say' ||
      targetValue === 'Prefer not to say') {
      return;
    }

    validFactors++;

    // Exact match
    if (userValue === targetValue) {
      totalScore += 100;
    }
    // Compatible lifestyle choices
    else if (areLifestyleCompatible(factor, userValue, targetValue)) {
      totalScore += 70;
    }
    // Somewhat compatible
    else if (areSomewhatCompatible(factor, userValue, targetValue)) {
      totalScore += 40;
    }
    // Not compatible
    else {
      totalScore += 10;
    }
  });

  return validFactors > 0 ? totalScore / validFactors : 50;
};

/**
 * Check if two lifestyle choices are compatible
 */
const areLifestyleCompatible = (factor, value1, value2) => {
  const compatible = {
    smoking: [
      ['Never', 'Socially'],
    ],
    drinking: [
      ['Never', 'Socially'],
      ['Socially', 'Regularly']
    ],
    exercise: [
      ['Sometimes', 'Regularly'],
      ['Regularly', 'Very active']
    ]
  };

  const compatiblePairs = compatible[factor] || [];
  return compatiblePairs.some(([a, b]) =>
    (value1 === a && value2 === b) || (value1 === b && value2 === a)
  );
};

/**
 * Check if two lifestyle choices are somewhat compatible
 */
const areSomewhatCompatible = (factor, value1, value2) => {
  const somewhat = {
    smoking: [
      ['Socially', 'Regularly'],
    ],
    drinking: [
      ['Never', 'Regularly']
    ],
    exercise: [
      ['Never', 'Sometimes'],
      ['Sometimes', 'Very active']
    ]
  };

  const somewhatPairs = somewhat[factor] || [];
  return somewhatPairs.some(([a, b]) =>
    (value1 === a && value2 === b) || (value1 === b && value2 === a)
  );
};

/**
 * Calculate profile quality bonus
 * @param {number} completeness - Profile completeness percentage
 * @returns {number} Bonus multiplier (1.0 to 1.2)
 */
export const calculateProfileBonus = (completeness) => {
  // More complete profiles get a bonus
  if (completeness >= 90) return 1.2;
  if (completeness >= 75) return 1.15;
  if (completeness >= 60) return 1.1;
  if (completeness >= 40) return 1.05;
  return 1.0;
};

/**
 * Calculate activity bonus
 * @param {Date} lastActive - Last active timestamp
 * @returns {number} Bonus multiplier (0.8 to 1.1)
 */
export const calculateActivityBonus = (lastActive) => {
  if (!lastActive) return 1.0;

  const hoursSinceActive = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60);

  // Active in last hour - boost
  if (hoursSinceActive < 1) return 1.1;
  // Active in last 24 hours - neutral
  if (hoursSinceActive < 24) return 1.0;
  // Active in last week - slight penalty
  if (hoursSinceActive < 168) return 0.95;
  // Inactive for more than a week - penalty
  return 0.8;
};

/**
 * Main compatibility calculation function
 * @param {object} currentUser - Current user object
 * @param {object} targetUser - Target user object
 * @returns {number} Overall compatibility score (0-100)
 */
export const calculateCompatibilityScore = (currentUser, targetUser) => {
  // Weight distribution for different factors
  const weights = {
    age: 0.15,
    location: 0.20,
    interests: 0.25,
    lifestyle: 0.20,
    relationshipGoals: 0.20
  };

  let totalScore = 0;

  // 1. Age Score
  const ageScore = calculateAgeScore(
    currentUser.age,
    targetUser.age,
    currentUser.matchPreferences || {}
  );
  totalScore += ageScore * weights.age;

  // 2. Location Score
  const locationScore = calculateLocationScore(
    currentUser.location,
    targetUser.location,
    currentUser.matchPreferences?.distanceRange || 50
  );
  totalScore += locationScore * weights.location;

  // 3. Interests Score
  const interestsScore = calculateInterestsScore(
    currentUser.interests,
    targetUser.interests
  );
  totalScore += interestsScore * weights.interests;

  // 4. Lifestyle Score
  const lifestyleScore = calculateLifestyleScore(
    currentUser.lifestyle,
    targetUser.lifestyle
  );
  totalScore += lifestyleScore * weights.lifestyle;

  // 5. Relationship Goals Score
  const goalScore = calculateRelationshipGoalScore(
    currentUser.relationshipGoals,
    targetUser.relationshipGoals
  );
  totalScore += goalScore * weights.relationshipGoals;

  // Apply profile completeness bonus
  const profileBonus = calculateProfileBonus(targetUser.profileCompleteness || 0);
  totalScore *= profileBonus;

  // Apply activity bonus
  const activityBonus = calculateActivityBonus(targetUser.lastActive);
  totalScore *= activityBonus;

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(totalScore)));
};

/**
 * Calculate relationship goal compatibility
 */
const calculateRelationshipGoalScore = (userGoal, targetGoal) => {
  if (!userGoal || !targetGoal) return 50;

  if (userGoal === targetGoal) return 100;

  // Compatible goals
  const compatible = {
    'Casual dating': ['Not sure yet'],
    'Long-term relationship': ['Marriage', 'Not sure yet'],
    'Marriage': ['Long-term relationship'],
    'Friendship': [],
    'Not sure yet': ['Casual dating', 'Long-term relationship']
  };

  if (compatible[userGoal]?.includes(targetGoal)) return 70;

  return 30;
};

/**
 * Filter users based on basic criteria
 * @param {object} currentUser - Current user
 * @param {object} targetUser - Target user to check
 * @returns {boolean} Whether user passes basic filters
 */
export const passesBasicFilters = (currentUser, targetUser) => {
  const prefs = currentUser.matchPreferences || {};

  // Check age range
  if (prefs.ageRange) {
    const { min = 18, max = 100 } = prefs.ageRange;
    if (targetUser.age < min || targetUser.age > max) {
      return false;
    }
  }

  // Check gender preference
  if (prefs.genderPreference && prefs.genderPreference.length > 0) {
    if (!prefs.genderPreference.includes(targetUser.gender)) {
      return false;
    }
  }

  // Check if user is active in discovery
  // Only exclude if explicitly set to false — undefined/null means user is discoverable
  if (targetUser.discoverySettings?.isActive === false) {
    return false;
  }

  // Check deal breakers (if implemented)
  // This would require more complex logic based on user attributes

  return true;
};

export default {
  calculateCompatibilityScore,
  calculateDistance,
  passesBasicFilters,
  calculateAgeScore,
  calculateLocationScore,
  calculateInterestsScore,
  calculateLifestyleScore,
  calculateProfileBonus,
  calculateActivityBonus
};