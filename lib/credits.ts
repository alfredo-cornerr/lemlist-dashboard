import { prisma } from './prisma'

// Credit types
export type CreditType = 'PURCHASE' | 'USAGE_EXPORT' | 'USAGE_SIGNAL' | 'REFUND' | 'BONUS'

// Credit costs
export const CREDIT_COSTS = {
  EXPORT_COMPANY: 1,        // 1 credit per company exported
  SIGNAL_PER_RUN: 1,        // 1 credit per signal per run
}

// Check if user has sufficient credits
export async function hasSufficientCredits(
  userId: string,
  requiredCredits: number
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  })
  
  return (user?.credits || 0) >= requiredCredits
}

// Deduct credits from user
export async function deductCredits(
  userId: string,
  amount: number,
  type: CreditType,
  description: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  const hasEnough = await hasSufficientCredits(userId, amount)
  
  if (!hasEnough) {
    return false
  }
  
  // Use transaction to ensure atomicity
  await prisma.$transaction([
    // Update user credits
    prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } },
    }),
    // Log the transaction
    prisma.creditLog.create({
      data: {
        userId,
        amount: -amount,
        type,
        description,
        metadata: metadata || {},
      },
    }),
  ])
  
  return true
}

// Add credits to user (purchases, refunds, bonuses)
export async function addCredits(
  userId: string,
  amount: number,
  type: CreditType,
  description: string,
  metadata?: Record<string, any>
): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
    }),
    prisma.creditLog.create({
      data: {
        userId,
        amount,
        type,
        description,
        metadata: metadata || {},
      },
    }),
  ])
}

// Get user's credit balance
export async function getCreditBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  })
  
  return user?.credits || 0
}

// Get credit usage history
export async function getCreditHistory(
  userId: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 50, offset = 0 } = options
  
  const [logs, total] = await Promise.all([
    prisma.creditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.creditLog.count({ where: { userId } }),
  ])
  
  return { logs, total }
}

// Calculate export cost
export function calculateExportCost(companyCount: number): number {
  return companyCount * CREDIT_COSTS.EXPORT_COMPANY
}

// Calculate signal monitoring cost
export function calculateSignalCost(
  signalCount: number,
  frequency: 'HOURLY' | 'DAILY' | 'WEEKLY'
): { perRun: number; daily: number; monthly: number } {
  const perRun = signalCount * CREDIT_COSTS.SIGNAL_PER_RUN
  
  const dailyMultiplier = {
    HOURLY: 24,
    DAILY: 1,
    WEEKLY: 1 / 7,
  }
  
  const daily = perRun * dailyMultiplier[frequency]
  const monthly = daily * 30
  
  return { perRun, daily: Math.round(daily), monthly: Math.round(monthly) }
}
