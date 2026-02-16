import { gql } from "graphql-tag";

export const emailGraphQLTypeDefs = gql`
  # ============================================
  # EMAIL VALIDATION
  # ============================================

  type EmailValidationResult {
    email: String!
    isValid: Boolean!
    errors: [String!]!
    warnings: [String!]!
    suggestions: [String!]!
    details: EmailValidationDetails!
  }

  type EmailValidationDetails {
    syntax: EmailSyntaxValidation!
    dns: EmailDNSValidation!
    disposable: EmailDisposableCheck!
    role: EmailRoleCheck!
    typo: EmailTypoCheck!
    provider: EmailProviderInfo!
  }

  type EmailSyntaxValidation {
    valid: Boolean!
    localPart: String!
    domain: String!
    hasValidFormat: Boolean!
  }

  type EmailDNSValidation {
    hasMX: Boolean!
    mxRecords: [String!]!
    hasA: Boolean!
    isReachable: Boolean!
  }

  type EmailDisposableCheck {
    isDisposable: Boolean!
    provider: String
  }

  type EmailRoleCheck {
    isRole: Boolean!
    detectedRole: String
  }

  type EmailTypoCheck {
    hasTypo: Boolean!
    suggestion: String
    confidence: Float!
  }

  type EmailProviderInfo {
    name: String!
    category: String!
    reputation: String!
  }

  input BatchEmailValidationInput {
    emails: [String!]!
  }

  type BatchEmailValidationResult {
    results: [EmailValidationResult!]!
    summary: BatchValidationSummary!
  }

  type BatchValidationSummary {
    total: Int!
    valid: Int!
    invalid: Int!
    warnings: Int!
  }

  # ============================================
  # SPAM SCORE CHECKING
  # ============================================

  type SpamScoreResult {
    score: Float!
    risk: String!
    passed: Boolean!
    issues: [SpamIssue!]!
    recommendations: [String!]!
    details: SpamScoreDetails!
  }

  type SpamIssue {
    category: String!
    severity: String!
    message: String!
    impact: Float!
  }

  type SpamScoreDetails {
    contentScore: Float!
    subjectScore: Float!
    linkScore: Float!
    imageScore: Float!
    structureScore: Float!
    flags: [String!]!
  }

  input SpamCheckInput {
    subject: String!
    html: String!
    text: String
    from: String!
  }

  # ============================================
  # TEMPLATE TESTING
  # ============================================

  type TemplateTestReport {
    templateId: String!
    templateName: String
    testedAt: DateTime!
    duration: Int!
    passed: Boolean!
    overallScore: Float!
    results: [TemplateTestResult!]!
    summary: TemplateTestSummary!
    issues: [String!]!
    recommendations: [String!]!
    metadata: JSON
  }

  type TemplateTestResult {
    testName: String!
    category: String!
    passed: Boolean!
    score: Float!
    message: String!
    severity: String!
    details: JSON!
  }

  type TemplateTestSummary {
    total: Int!
    passed: Int!
    failed: Int!
    warnings: Int!
    errors: Int!
  }

  input TemplateTestInput {
    templateId: String!
    templateName: String
    subject: String!
    html: String!
    text: String
    from: String
    variables: JSON
    testRecipient: String
    checkLinks: Boolean
    checkImages: Boolean
    minScore: Float
    version: String
    environment: String
  }

  type BatchTemplateTestResult {
    reports: [TemplateTestReport!]!
    statistics: TemplateTestStatistics!
  }

  type TemplateTestStatistics {
    totalTests: Int!
    passed: Int!
    failed: Int!
    averageScore: Float!
    criticalIssues: Int!
    commonIssues: [String!]!
  }

  # ============================================
  # A/B TESTING
  # ============================================

  type ABTest {
    id: ID!
    name: String!
    description: String
    status: ABTestStatus!
    variants: [ABTestVariant!]!
    distribution: ABTestDistribution!
    minSampleSize: Int!
    confidenceLevel: Float!
    primaryMetric: String!
    secondaryMetrics: [String!]!
    startDate: DateTime
    endDate: DateTime
    winnerId: String
    autoSelectWinner: Boolean!
    winnerCriteria: ABTestWinnerCriteria!
    createdAt: DateTime!
    updatedAt: DateTime!
    metadata: JSON
  }

  type ABTestVariant {
    id: ID!
    testId: String!
    name: String!
    description: String
    subject: String!
    html: String!
    text: String
    weight: Float!
    metadata: JSON
    createdAt: DateTime!
  }

  type ABTestResult {
    testId: String!
    testName: String!
    status: ABTestStatus!
    startDate: DateTime
    endDate: DateTime
    duration: Int
    variants: [ABTestVariantResult!]!
    winner: ABTestWinner
    hasWinner: Boolean!
    confidence: Float!
    hasMinSampleSize: Boolean!
    primaryMetric: String!
    recommendations: [String!]!
  }

  type ABTestVariantResult {
    variant: ABTestVariant!
    sent: Int!
    opens: Int!
    clicks: Int!
    conversions: Int!
    bounces: Int!
    unsubscribes: Int!
    revenue: Float!
    openRate: Float!
    clickRate: Float!
    conversionRate: Float!
    bounceRate: Float!
    unsubscribeRate: Float!
    clickToOpenRate: Float!
    revenuePerEmail: Float!
  }

  type ABTestWinner {
    variant: ABTestVariant!
    metric: String!
    value: Float!
    improvement: Float!
    confidence: Float!
    sampleSize: Int!
  }

  type ABTestWinnerCriteria {
    metric: String!
    minimumImprovement: Float!
    confidenceLevel: Float!
  }

  enum ABTestStatus {
    draft
    running
    paused
    completed
    archived
  }

  enum ABTestDistribution {
    random
    weighted
    sequential
    sticky
  }

  input CreateABTestInput {
    name: String!
    description: String
    variants: [ABTestVariantInput!]!
    distribution: ABTestDistribution
    minSampleSize: Int
    confidenceLevel: Float
    primaryMetric: String
    secondaryMetrics: [String!]
    startDate: DateTime
    endDate: DateTime
    autoSelectWinner: Boolean
    winnerCriteria: ABTestWinnerCriteriaInput
    metadata: JSON
  }

  input ABTestVariantInput {
    name: String!
    description: String
    subject: String!
    html: String!
    text: String
    weight: Float
    metadata: JSON
  }

  input ABTestWinnerCriteriaInput {
    metric: String!
    minimumImprovement: Float
    confidenceLevel: Float
  }

  input ABTestFilterInput {
    status: ABTestStatus
    search: String
  }

  input TrackABTestEventInput {
    testId: String!
    variantId: String!
    userId: String!
    eventType: ABTestEventType!
    value: Float
    url: String
  }

  enum ABTestEventType {
    sent
    open
    click
    conversion
    bounce
    unsubscribe
  }

  # ============================================
  # RATE LIMITING
  # ============================================

  type RateLimitResult {
    allowed: Boolean!
    domain: String!
    reason: String
    limits: DomainLimits!
    current: RateLimitCurrent!
    retryAfter: Int!
    nextAvailable: Float!
  }

  type DomainLimits {
    perMinute: Int!
    perHour: Int!
    perDay: Int!
    burstSize: Int
    burstWindow: Int
  }

  type RateLimitCurrent {
    perMinute: Int!
    perHour: Int!
    perDay: Int!
    burst: Int!
  }

  type RateLimitStatus {
    domain: String!
    limits: DomainLimits!
    current: RateLimitCurrent!
    utilization: RateLimitUtilization!
    isWarmupMode: Boolean!
    warmupProgress: WarmupProgress
    lastSent: Float
    totalSent: Int!
  }

  type RateLimitUtilization {
    perMinute: Float!
    perHour: Float!
    perDay: Float!
    burst: Float!
  }

  input SetDomainLimitInput {
    domain: String!
    perMinute: Int
    perHour: Int
    perDay: Int
    burstSize: Int
    burstWindow: Int
  }

  input EnableWarmupInput {
    domain: String!
    startRate: Int!
    targetRate: Int!
    incrementPerDay: Int
    durationDays: Int!
    startDate: DateTime
  }

  type BatchSendRecommendation {
    canSendNow: [String!]!
    shouldWait: [EmailWaitRecommendation!]!
    groupedByDomain: JSON!
  }

  type EmailWaitRecommendation {
    email: String!
    waitMs: Int!
  }

  # ============================================
  # IP WARMUP
  # ============================================

  type IPWarmupStatus {
    id: ID!
    ipAddress: String!
    status: IPWarmupStatusEnum!
    startDate: DateTime!
    endDate: DateTime!
    currentDay: Int!
    totalDays: Int!
    strategy: String!
    startVolume: Int!
    targetVolume: Int!
    currentVolume: Int!
    todayQuota: Int!
    todayUsed: Int!
    reputation: IPReputation!
    progress: Float!
    recommendation: String!
    pausedAt: DateTime
    pausedReason: String
    completedAt: DateTime
    lastUpdated: DateTime!
    metadata: JSON
  }

  type IPReputation {
    score: Float!
    level: String!
    bounceRate: Float!
    complaintRate: Float!
    openRate: Float!
    clickRate: Float!
  }

  type IPWarmupProgress {
    warmupId: String!
    daysCompleted: Int!
    daysRemaining: Int!
    totalDays: Int!
    currentVolume: Int!
    targetVolume: Int!
    volumeProgress: Float!
    timeProgress: Float!
    onSchedule: Boolean!
    schedule: [IPWarmupScheduleDay!]!
    reputation: IPReputation!
    recommendation: String!
  }

  type IPWarmupScheduleDay {
    day: Int!
    volume: Int!
    cumulativeVolume: Int!
    recommendations: [String!]!
  }

  type IPWarmupQuota {
    total: Int!
    used: Int!
    remaining: Int!
    percentUsed: Float!
  }

  type IPReputationMetrics {
    date: String!
    sent: Int!
    bounceRate: Float!
    complaintRate: Float!
    openRate: Float!
    clickRate: Float!
    unsubscribeRate: Float!
    reputationScore: Float!
  }

  enum IPWarmupStatusEnum {
    active
    paused
    completed
    failed
  }

  enum IPWarmupStrategy {
    aggressive
    standard
    conservative
  }

  input StartIPWarmupInput {
    ipAddress: String!
    startVolume: Int!
    targetVolume: Int!
    durationDays: Int
    strategy: IPWarmupStrategy
    metadata: JSON
  }

  input RecordIPSendInput {
    warmupId: String!
    success: Boolean!
    bounced: Boolean
    bounceType: String
    complaint: Boolean
    opened: Boolean
    clicked: Boolean
    unsubscribed: Boolean
  }

  # ============================================
  # QUERIES
  # ============================================

  extend type Query {
    # Email Validation
    validateEmail(email: String!): EmailValidationResult!
    validateEmailBatch(
      input: BatchEmailValidationInput!
    ): BatchEmailValidationResult!

    # Spam Checking
    checkSpamScore(input: SpamCheckInput!): SpamScoreResult!

    # Template Testing
    testTemplate(input: TemplateTestInput!): TemplateTestReport!
    testTemplates(inputs: [TemplateTestInput!]!): BatchTemplateTestResult!

    # A/B Testing
    getABTest(id: String!): ABTest
    listABTests(filter: ABTestFilterInput): [ABTest!]!
    getABTestResult(testId: String!): ABTestResult!
    getABTestVariant(testId: String!, userId: String!): ABTestVariant!

    # Rate Limiting
    checkRateLimit(email: String!): RateLimitResult!
    getRateLimitStatus(domain: String!): RateLimitStatus!
    getAllRateLimitStatuses: [RateLimitStatus!]!
    getBatchSendRecommendation(emails: [String!]!): BatchSendRecommendation!

    # IP Warmup
    getIPWarmupStatus(warmupId: String!): IPWarmupStatus
    getActiveIPWarmups: [IPWarmupStatus!]!
    getIPWarmupProgress(warmupId: String!): IPWarmupProgress!
    getIPWarmupQuota(warmupId: String!): IPWarmupQuota!
    getIPReputationMetrics(
      warmupId: String!
      days: Int
    ): [IPReputationMetrics!]!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  extend type Mutation {
    # A/B Testing
    createABTest(input: CreateABTestInput!): ABTest!
    startABTest(testId: String!): ABTest!
    pauseABTest(testId: String!): ABTest!
    completeABTest(testId: String!, winnerId: String): ABTest!
    deleteABTest(testId: String!): Boolean!
    trackABTestEvent(input: TrackABTestEventInput!): Boolean!

    # Rate Limiting
    recordEmailSent(email: String!): Boolean!
    setDomainLimit(input: SetDomainLimitInput!): Boolean!
    enableRateLimitWarmup(input: EnableWarmupInput!): Boolean!
    disableRateLimitWarmup(domain: String!): Boolean!
    resetDomainRateLimit(domain: String!): Boolean!
    clearAllRateLimits: Boolean!

    # IP Warmup
    startIPWarmup(input: StartIPWarmupInput!): IPWarmupStatus!
    pauseIPWarmup(warmupId: String!, reason: String): IPWarmupStatus!
    resumeIPWarmup(warmupId: String!): IPWarmupStatus!
    completeIPWarmup(warmupId: String!): IPWarmupStatus!
    recordIPSend(input: RecordIPSendInput!): Boolean!
  }

  # ============================================
  # SUBSCRIPTIONS
  # ============================================

  extend type Subscription {
    # A/B Test Updates
    abTestUpdated(testId: String!): ABTest!
    abTestResultUpdated(testId: String!): ABTestResult!

    # Rate Limit Alerts
    rateLimitAlert(domain: String): RateLimitStatus!

    # IP Warmup Updates
    ipWarmupUpdated(warmupId: String!): IPWarmupStatus!
    ipReputationAlert(warmupId: String!): IPReputation!
  }
`;
