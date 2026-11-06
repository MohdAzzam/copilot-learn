import { Activity, Team, User, Workout } from '../models/index.js';
import { Types } from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw Object.assign(new Error('Activity input must be an object'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' || !Types.ObjectId.isValid(userId) ||
    typeof teamId !== 'string' || !Types.ObjectId.isValid(teamId)
  ) {
    throw Object.assign(new Error('Valid userId and teamId are required'), { status: 400 });
  }
  if (typeof type !== 'string' || !type.trim() || typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw Object.assign(new Error('A type and positive minutes value are required'), { status: 400 });
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw Object.assign(new Error('Team input must be an object'), { status: 400 });
  }

  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim()) {
    throw Object.assign(new Error('Team name is required'), { status: 400 });
  }
  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('Team mascot is required'), { status: 400 });
  }
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !Types.ObjectId.isValid(member))) {
    throw Object.assign(new Error('Team members must be valid user IDs'), { status: 400 });
  }

  return Team.create({ name, mascot, members });
}

export async function getLeaderboard() {
  const [teams, activityTotals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const totalsByTeam = new Map(activityTotals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));

  return teams
    .map(({ _id, name }) => ({ teamName: name, totalPoints: totalsByTeam.get(_id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const goal = user.fitnessGoal?.trim();
  let workouts = goal ? await Workout.find({ focus: goal }).lean() : [];
  let reason = goal ? `Recommended for your ${goal} fitness goal.` : '';

  if (workouts.length === 0 && recentActivity) {
    const activityType = recentActivity.type.toLowerCase();
    const focus = activityType === 'run' || activityType === 'cycle'
      ? 'endurance'
      : activityType;
    workouts = await Workout.find({ focus }).lean();
    reason = `Recommended based on your recent ${recentActivity.type} activity.`;
  }

  return workouts.map((workout) => ({ ...workout, reason }));
}

export { User };
