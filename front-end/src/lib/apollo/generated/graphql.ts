import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: string; output: string; }
  Decimal: { input: string; output: string; }
  JSON: { input: Record<string, unknown>; output: Record<string, unknown>; }
  Upload: { input: any; output: any; }
};

export type ActivePlanStats = {
  __typename?: 'ActivePlanStats';
  count: Scalars['Int']['output'];
  plan_name: Scalars['String']['output'];
};

export type AttendanceStats = {
  __typename?: 'AttendanceStats';
  current_month: Scalars['Int']['output'];
  last_session?: Maybe<Scalars['String']['output']>;
  monthly_average: Scalars['Float']['output'];
  total_presences: Scalars['Int']['output'];
  user_id: Scalars['Int']['output'];
};

export type AuthResult = {
  __typename?: 'AuthResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  token?: Maybe<Scalars['String']['output']>;
  user?: Maybe<Users>;
};

export type BirthdayInfo = {
  __typename?: 'BirthdayInfo';
  age: Scalars['Int']['output'];
  birth_date: Scalars['String']['output'];
  first_name: Scalars['String']['output'];
  last_name: Scalars['String']['output'];
  user_id: Scalars['Int']['output'];
};

export type CreateInstructorInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  bio?: InputMaybe<Scalars['String']['input']>;
  certifications?: InputMaybe<Scalars['String']['input']>;
  specialization?: InputMaybe<Scalars['String']['input']>;
  user_id: Scalars['Int']['input'];
};

export type CreateMessageTypeInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  type_name: Scalars['String']['input'];
};

export type CreateNotificationInput = {
  message: Scalars['String']['input'];
  title: Scalars['String']['input'];
  type: Scalars['String']['input'];
  user_id?: InputMaybe<Scalars['Int']['input']>;
  user_ids?: InputMaybe<Array<Scalars['Int']['input']>>;
};

export type CreateOrderInput = {
  delivery_address?: InputMaybe<Scalars['String']['input']>;
  items: Array<OrderItemInput>;
  notes?: InputMaybe<Scalars['String']['input']>;
  user_id: Scalars['Int']['input'];
};

export type CreatePaymentInput = {
  amount: Scalars['Float']['input'];
  order_id?: InputMaybe<Scalars['Int']['input']>;
  payment_method: Scalars['String']['input'];
  stripe_payment_intent_id?: InputMaybe<Scalars['String']['input']>;
  subscription_id?: InputMaybe<Scalars['Int']['input']>;
  user_id: Scalars['Int']['input'];
};

export type CreateProductInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  category_id: Scalars['Int']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  image_url?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  price: Scalars['Float']['input'];
};

export type CreateSessionInput = {
  date: Scalars['String']['input'];
  end_time: Scalars['String']['input'];
  instructor_id: Scalars['Int']['input'];
  location?: InputMaybe<Scalars['String']['input']>;
  max_participants?: InputMaybe<Scalars['Int']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  session_type_id: Scalars['Int']['input'];
  start_time: Scalars['String']['input'];
};

export type CreateUserInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  birth_date?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  first_name: Scalars['String']['input'];
  gender_id?: InputMaybe<Scalars['Int']['input']>;
  last_name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  phone?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
};

export type EmailCheckResult = {
  __typename?: 'EmailCheckResult';
  email: Scalars['String']['output'];
  exists: Scalars['Boolean']['output'];
};

export type Genders = {
  __typename?: 'Genders';
  active?: Maybe<Scalars['Boolean']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  gender_name: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  updated_at?: Maybe<Scalars['String']['output']>;
};

export type Grades = {
  __typename?: 'Grades';
  active?: Maybe<Scalars['Boolean']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  grade_name: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  level_order?: Maybe<Scalars['Int']['output']>;
  updated_at?: Maybe<Scalars['String']['output']>;
};

export type Instructors = {
  __typename?: 'Instructors';
  active?: Maybe<Scalars['Boolean']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  certifications?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  specialization?: Maybe<Scalars['String']['output']>;
  user_id: Scalars['Int']['output'];
};

export type MembersByGenderStats = {
  __typename?: 'MembersByGenderStats';
  count: Scalars['Int']['output'];
  gender_name: Scalars['String']['output'];
};

export type MembersByGradeStats = {
  __typename?: 'MembersByGradeStats';
  count: Scalars['Int']['output'];
  grade_name: Scalars['String']['output'];
};

export type MembersByPlanStats = {
  __typename?: 'MembersByPlanStats';
  count: Scalars['Int']['output'];
  plan_name: Scalars['String']['output'];
};

export type MembersCountStats = {
  __typename?: 'MembersCountStats';
  count: Scalars['Int']['output'];
};

export type MessageRecipients = {
  __typename?: 'MessageRecipients';
  created_at?: Maybe<Scalars['String']['output']>;
  deleted?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['Int']['output'];
  message?: Maybe<Messages>;
  message_id: Scalars['Int']['output'];
  read?: Maybe<Scalars['Boolean']['output']>;
  read_at?: Maybe<Scalars['String']['output']>;
  recipient?: Maybe<Users>;
  recipient_id: Scalars['Int']['output'];
};

export type MessageTypes = {
  __typename?: 'MessageTypes';
  active?: Maybe<Scalars['Boolean']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  type_name: Scalars['String']['output'];
  updated_at?: Maybe<Scalars['String']['output']>;
};

export type Messages = {
  __typename?: 'Messages';
  content: Scalars['String']['output'];
  created_at?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  messageType?: Maybe<MessageTypes>;
  recipients?: Maybe<Array<MessageRecipients>>;
  sender?: Maybe<Users>;
  sender_id: Scalars['Int']['output'];
  sent_at?: Maybe<Scalars['String']['output']>;
  subject?: Maybe<Scalars['String']['output']>;
  type_message_id?: Maybe<Scalars['Int']['output']>;
};

export type MonthlyPaymentsBreakdown = {
  __typename?: 'MonthlyPaymentsBreakdown';
  count: Scalars['Int']['output'];
  month: Scalars['String']['output'];
  total: Scalars['Float']['output'];
};

export type MonthlyPaymentsStats = {
  __typename?: 'MonthlyPaymentsStats';
  count: Scalars['Int']['output'];
  total: Scalars['Float']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  cancelEnrollment: MutationResult;
  cancelSubscription: MutationResult;
  changePassword: AuthResult;
  createInstructor: Instructors;
  createMessageType: MessageTypes;
  createNotification: Notifications;
  createOrder: Orders;
  createPayment: Payments;
  createProduct: Products;
  createSession: Sessions;
  createSubscription: UserSubscriptions;
  createUser: Users;
  deleteInstructor: MutationResult;
  deleteMessageType: MutationResult;
  deleteProduct: MutationResult;
  deleteReceivedMessage: MutationResult;
  deleteSession: MutationResult;
  deleteUser: MutationResult;
  enrollUser: SessionEnrollments;
  login: AuthResult;
  logout: AuthResult;
  markMessageAsRead: MessageRecipients;
  markNotificationAsRead: Notifications;
  processPayment: PaymentResult;
  register: AuthResult;
  requestPasswordReset: AuthResult;
  resetPassword: AuthResult;
  restoreMessage: MessageRecipients;
  sendMessage: Messages;
  updateEnrollmentStatus: SessionEnrollments;
  updateInstructor: Instructors;
  updateMessageType: MessageTypes;
  updateOrderStatus: Orders;
  updateProduct: Products;
  updateSession: Sessions;
  updateUser: Users;
  uploadFiles: UploadResponse;
};


export type MutationCancelEnrollmentArgs = {
  enrollmentId: Scalars['Int']['input'];
};


export type MutationCancelSubscriptionArgs = {
  subscriptionId: Scalars['Int']['input'];
};


export type MutationChangePasswordArgs = {
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
  userId: Scalars['Int']['input'];
};


export type MutationCreateInstructorArgs = {
  input: CreateInstructorInput;
};


export type MutationCreateMessageTypeArgs = {
  input: CreateMessageTypeInput;
};


export type MutationCreateNotificationArgs = {
  input: CreateNotificationInput;
};


export type MutationCreateOrderArgs = {
  input: CreateOrderInput;
};


export type MutationCreatePaymentArgs = {
  input: CreatePaymentInput;
};


export type MutationCreateProductArgs = {
  input: CreateProductInput;
};


export type MutationCreateSessionArgs = {
  input: CreateSessionInput;
};


export type MutationCreateSubscriptionArgs = {
  planId: Scalars['Int']['input'];
  userId: Scalars['Int']['input'];
};


export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


export type MutationDeleteInstructorArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteMessageTypeArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteProductArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteReceivedMessageArgs = {
  recipientId: Scalars['Int']['input'];
};


export type MutationDeleteSessionArgs = {
  id: Scalars['Int']['input'];
};


export type MutationDeleteUserArgs = {
  id: Scalars['Int']['input'];
};


export type MutationEnrollUserArgs = {
  sessionId: Scalars['Int']['input'];
  userId: Scalars['Int']['input'];
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationMarkMessageAsReadArgs = {
  recipientId: Scalars['Int']['input'];
};


export type MutationMarkNotificationAsReadArgs = {
  notificationId: Scalars['Int']['input'];
};


export type MutationProcessPaymentArgs = {
  paymentId: Scalars['Int']['input'];
};


export type MutationRegisterArgs = {
  input: RegisterInput;
};


export type MutationRequestPasswordResetArgs = {
  email: Scalars['String']['input'];
};


export type MutationResetPasswordArgs = {
  newPassword: Scalars['String']['input'];
  token: Scalars['String']['input'];
};


export type MutationRestoreMessageArgs = {
  recipientId: Scalars['Int']['input'];
};


export type MutationSendMessageArgs = {
  input: SendMessageInput;
};


export type MutationUpdateEnrollmentStatusArgs = {
  enrollmentId: Scalars['Int']['input'];
  status: Scalars['String']['input'];
};


export type MutationUpdateInstructorArgs = {
  id: Scalars['Int']['input'];
  input: UpdateInstructorInput;
};


export type MutationUpdateMessageTypeArgs = {
  id: Scalars['Int']['input'];
  input: UpdateMessageTypeInput;
};


export type MutationUpdateOrderStatusArgs = {
  orderId: Scalars['Int']['input'];
  status: Scalars['String']['input'];
};


export type MutationUpdateProductArgs = {
  id: Scalars['Int']['input'];
  input: UpdateProductInput;
};


export type MutationUpdateSessionArgs = {
  id: Scalars['Int']['input'];
  input: UpdateSessionInput;
};


export type MutationUpdateUserArgs = {
  id: Scalars['Int']['input'];
  input: UpdateUserInput;
};


export type MutationUploadFilesArgs = {
  files: Array<Scalars['Upload']['input']>;
};

export type MutationResult = {
  __typename?: 'MutationResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type Notifications = {
  __typename?: 'Notifications';
  created_at?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  message: Scalars['String']['output'];
  read?: Maybe<Scalars['Boolean']['output']>;
  read_at?: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  type: Scalars['String']['output'];
  user?: Maybe<Users>;
  user_id: Scalars['Int']['output'];
};

export type OrderItemInput = {
  price: Scalars['Float']['input'];
  product_id: Scalars['Int']['input'];
  quantity: Scalars['Int']['input'];
  stock_id?: InputMaybe<Scalars['Int']['input']>;
};

export type OrderItems = {
  __typename?: 'OrderItems';
  id: Scalars['Int']['output'];
  order_id: Scalars['Int']['output'];
  price: Scalars['Float']['output'];
  product_id: Scalars['Int']['output'];
  quantity: Scalars['Int']['output'];
  stock_id?: Maybe<Scalars['Int']['output']>;
};

export type Orders = {
  __typename?: 'Orders';
  created_at?: Maybe<Scalars['String']['output']>;
  delivery_address?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  total_amount: Scalars['Float']['output'];
  updated_at?: Maybe<Scalars['String']['output']>;
  user_id: Scalars['Int']['output'];
};

export type PasswordResetTokenValidation = {
  __typename?: 'PasswordResetTokenValidation';
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['Int']['output']>;
  valid: Scalars['Boolean']['output'];
};

export type PasswordResetTokens = {
  __typename?: 'PasswordResetTokens';
  created_at?: Maybe<Scalars['String']['output']>;
  expires_at: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  token: Scalars['String']['output'];
  used_at?: Maybe<Scalars['String']['output']>;
  user_id: Scalars['Int']['output'];
};

export type PaymentInfo = {
  __typename?: 'PaymentInfo';
  amount: Scalars['Float']['output'];
  id: Scalars['Int']['output'];
  payment_date: Scalars['String']['output'];
  status: Scalars['String']['output'];
  user_first_name?: Maybe<Scalars['String']['output']>;
  user_id: Scalars['Int']['output'];
  user_last_name?: Maybe<Scalars['String']['output']>;
};

export type PaymentResult = {
  __typename?: 'PaymentResult';
  clientSecret?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  payment?: Maybe<Payments>;
  success: Scalars['Boolean']['output'];
};

export type Payments = {
  __typename?: 'Payments';
  amount: Scalars['Float']['output'];
  created_at?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  order_id?: Maybe<Scalars['Int']['output']>;
  payment_date?: Maybe<Scalars['String']['output']>;
  payment_method: Scalars['String']['output'];
  status: Scalars['String']['output'];
  stripe_payment_intent_id?: Maybe<Scalars['String']['output']>;
  subscription_id?: Maybe<Scalars['Int']['output']>;
  user_id: Scalars['Int']['output'];
};

export type ProductCategories = {
  __typename?: 'ProductCategories';
  active?: Maybe<Scalars['Boolean']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

export type ProductStocks = {
  __typename?: 'ProductStocks';
  id: Scalars['Int']['output'];
  min_quantity?: Maybe<Scalars['Int']['output']>;
  product_id: Scalars['Int']['output'];
  quantity: Scalars['Int']['output'];
  size_id?: Maybe<Scalars['Int']['output']>;
  updated_at?: Maybe<Scalars['String']['output']>;
};

export type Products = {
  __typename?: 'Products';
  active?: Maybe<Scalars['Boolean']['output']>;
  category_id?: Maybe<Scalars['Int']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  image_url?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  price: Scalars['Float']['output'];
  updated_at?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  activePlans: Array<ActivePlanStats>;
  attendanceStats?: Maybe<AttendanceStats>;
  birthdays: Array<BirthdayInfo>;
  checkEmail: EmailCheckResult;
  gender?: Maybe<Genders>;
  genders: Array<Genders>;
  grade?: Maybe<Grades>;
  grades: Array<Grades>;
  health: Scalars['String']['output'];
  instructors: Array<Instructors>;
  lastPayments: Array<PaymentInfo>;
  me?: Maybe<Users>;
  membersByGender: Array<MembersByGenderStats>;
  membersByGrade: Array<MembersByGradeStats>;
  membersByPlan: Array<MembersByPlanStats>;
  membersCount: MembersCountStats;
  messageTypes: Array<MessageTypes>;
  messagesReceived: Array<MessageRecipients>;
  messagesTrashed: Array<MessageRecipients>;
  monthlyPayments: MonthlyPaymentsStats;
  newMembers: Array<Users>;
  notifications: Array<Notifications>;
  order?: Maybe<Orders>;
  orders: Array<Orders>;
  overduePayments: Array<PaymentInfo>;
  payment?: Maybe<Payments>;
  payments: Array<Payments>;
  paymentsByMonth: Array<MonthlyPaymentsBreakdown>;
  pendingPayments: Array<PaymentInfo>;
  product?: Maybe<Products>;
  productCategories: Array<ProductCategories>;
  productStocks: Array<ProductStocks>;
  products: Array<Products>;
  recentPayments: Array<PaymentInfo>;
  renewalRate: RenewalRateStats;
  session?: Maybe<Sessions>;
  sessionEnrollments: Array<SessionEnrollments>;
  sessionTypes: Array<SessionTypes>;
  sessions: Array<Sessions>;
  status?: Maybe<Statuses>;
  statuses: Array<Statuses>;
  stockSizes: Array<StockSizes>;
  subscription?: Maybe<SubscriptionPlans>;
  subscriptions: Array<SubscriptionPlans>;
  topMembers: Array<TopMemberStats>;
  topProducts: Array<TopProductStats>;
  unreadMessagesCount: UnreadMessagesCount;
  user?: Maybe<Users>;
  userEnrollments: Array<SessionEnrollments>;
  userSubscription?: Maybe<UserSubscriptions>;
  users: Array<Users>;
  verifyResetToken?: Maybe<PasswordResetTokenValidation>;
  weeklySessions: WeeklySessionsStats;
};


export type QueryAttendanceStatsArgs = {
  userId: Scalars['Int']['input'];
};


export type QueryCheckEmailArgs = {
  email: Scalars['String']['input'];
};


export type QueryGenderArgs = {
  id: Scalars['Int']['input'];
};


export type QueryGradeArgs = {
  id: Scalars['Int']['input'];
};


export type QueryInstructorsArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryLastPaymentsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryMessagesReceivedArgs = {
  userId: Scalars['Int']['input'];
};


export type QueryMessagesTrashedArgs = {
  userId: Scalars['Int']['input'];
};


export type QueryNewMembersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryNotificationsArgs = {
  userId: Scalars['Int']['input'];
};


export type QueryOrderArgs = {
  id: Scalars['Int']['input'];
};


export type QueryOrdersArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
  userId?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPaymentArgs = {
  id: Scalars['Int']['input'];
};


export type QueryPaymentsArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
  userId?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryProductArgs = {
  id: Scalars['Int']['input'];
};


export type QueryProductStocksArgs = {
  productId: Scalars['Int']['input'];
};


export type QueryProductsArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRecentPaymentsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySessionArgs = {
  id: Scalars['Int']['input'];
};


export type QuerySessionEnrollmentsArgs = {
  sessionId: Scalars['Int']['input'];
};


export type QuerySessionsArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryStatusArgs = {
  id: Scalars['Int']['input'];
};


export type QuerySubscriptionArgs = {
  id: Scalars['Int']['input'];
};


export type QueryTopMembersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTopProductsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryUnreadMessagesCountArgs = {
  userId: Scalars['Int']['input'];
};


export type QueryUserArgs = {
  id: Scalars['Int']['input'];
};


export type QueryUserEnrollmentsArgs = {
  userId: Scalars['Int']['input'];
};


export type QueryUserSubscriptionArgs = {
  userId: Scalars['Int']['input'];
};


export type QueryUsersArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryVerifyResetTokenArgs = {
  token: Scalars['String']['input'];
};

export type RegisterInput = {
  birth_date?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  first_name: Scalars['String']['input'];
  gender_id?: InputMaybe<Scalars['Int']['input']>;
  last_name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  phone?: InputMaybe<Scalars['String']['input']>;
};

export type RenewalRateStats = {
  __typename?: 'RenewalRateStats';
  rate: Scalars['Float']['output'];
};

export type SendMessageInput = {
  content: Scalars['String']['input'];
  recipient_ids: Array<Scalars['Int']['input']>;
  sender_id: Scalars['Int']['input'];
  subject?: InputMaybe<Scalars['String']['input']>;
  type_message_id?: InputMaybe<Scalars['Int']['input']>;
};

export type SessionEnrollments = {
  __typename?: 'SessionEnrollments';
  enrolled_at?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  session_id: Scalars['Int']['output'];
  status?: Maybe<Scalars['String']['output']>;
  user_id: Scalars['Int']['output'];
};

export type SessionTypes = {
  __typename?: 'SessionTypes';
  active?: Maybe<Scalars['Boolean']['output']>;
  activity_id: Scalars['Int']['output'];
  description?: Maybe<Scalars['String']['output']>;
  duration_minutes?: Maybe<Scalars['Int']['output']>;
  id: Scalars['Int']['output'];
  max_participants?: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
  price?: Maybe<Scalars['Float']['output']>;
};

export type Sessions = {
  __typename?: 'Sessions';
  created_at?: Maybe<Scalars['String']['output']>;
  current_participants?: Maybe<Scalars['Int']['output']>;
  date: Scalars['String']['output'];
  end_time: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  instructor_id: Scalars['Int']['output'];
  location?: Maybe<Scalars['String']['output']>;
  max_participants?: Maybe<Scalars['Int']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  session_type_id: Scalars['Int']['output'];
  start_time: Scalars['String']['output'];
  status?: Maybe<Scalars['String']['output']>;
};

export type Statuses = {
  __typename?: 'Statuses';
  active?: Maybe<Scalars['Boolean']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  status_name: Scalars['String']['output'];
  updated_at?: Maybe<Scalars['String']['output']>;
};

export type StockSizes = {
  __typename?: 'StockSizes';
  code?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

export type SubscriptionPlans = {
  __typename?: 'SubscriptionPlans';
  active?: Maybe<Scalars['Boolean']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  duration_months: Scalars['Int']['output'];
  features?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  price: Scalars['Float']['output'];
  subscription_name: Scalars['String']['output'];
  updated_at?: Maybe<Scalars['String']['output']>;
};

export type TopMemberStats = {
  __typename?: 'TopMemberStats';
  attendance_rate: Scalars['Float']['output'];
  first_name: Scalars['String']['output'];
  last_name: Scalars['String']['output'];
  total_presences: Scalars['Int']['output'];
  user_id: Scalars['Int']['output'];
};

export type TopProductStats = {
  __typename?: 'TopProductStats';
  name: Scalars['String']['output'];
  product_id: Scalars['Int']['output'];
  quantity_sold: Scalars['Int']['output'];
  total_revenue: Scalars['Float']['output'];
};

export type UnreadMessagesCount = {
  __typename?: 'UnreadMessagesCount';
  count: Scalars['Int']['output'];
};

export type UpdateInstructorInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  bio?: InputMaybe<Scalars['String']['input']>;
  certifications?: InputMaybe<Scalars['String']['input']>;
  specialization?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateMessageTypeInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  type_name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateProductInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  category_id?: InputMaybe<Scalars['Int']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  image_url?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  price?: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateSessionInput = {
  date?: InputMaybe<Scalars['String']['input']>;
  end_time?: InputMaybe<Scalars['String']['input']>;
  instructor_id?: InputMaybe<Scalars['Int']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  max_participants?: InputMaybe<Scalars['Int']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  session_type_id?: InputMaybe<Scalars['Int']['input']>;
  start_time?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  address?: InputMaybe<Scalars['String']['input']>;
  birth_date?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  first_name?: InputMaybe<Scalars['String']['input']>;
  gender_id?: InputMaybe<Scalars['Int']['input']>;
  last_name?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
};

export type UploadResponse = {
  __typename?: 'UploadResponse';
  files: Array<UploadedFile>;
};

export type UploadedFile = {
  __typename?: 'UploadedFile';
  name: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type UserProfiles = {
  __typename?: 'UserProfiles';
  avatar_url?: Maybe<Scalars['String']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  emergency_contact_name?: Maybe<Scalars['String']['output']>;
  emergency_contact_phone?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  preferences?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['String']['output']>;
  user_id: Scalars['Int']['output'];
};

export type UserSecurity = {
  __typename?: 'UserSecurity';
  account_locked_until?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  failed_login_attempts?: Maybe<Scalars['Int']['output']>;
  id: Scalars['Int']['output'];
  last_login_at?: Maybe<Scalars['String']['output']>;
  last_login_ip?: Maybe<Scalars['String']['output']>;
  password_changed_at?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['String']['output']>;
  user_id: Scalars['Int']['output'];
};

export type UserSubscriptions = {
  __typename?: 'UserSubscriptions';
  active?: Maybe<Scalars['Boolean']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  end_date: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  start_date: Scalars['String']['output'];
  subscription?: Maybe<SubscriptionPlans>;
  subscription_id: Scalars['Int']['output'];
  updated_at?: Maybe<Scalars['String']['output']>;
  user_id: Scalars['Int']['output'];
};

export type Users = {
  __typename?: 'Users';
  active?: Maybe<Scalars['Boolean']['output']>;
  address?: Maybe<Scalars['String']['output']>;
  birth_date?: Maybe<Scalars['String']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  email_verified?: Maybe<Scalars['Boolean']['output']>;
  first_name: Scalars['String']['output'];
  gender_id?: Maybe<Scalars['Int']['output']>;
  id: Scalars['Int']['output'];
  last_name: Scalars['String']['output'];
  password: Scalars['String']['output'];
  phone?: Maybe<Scalars['String']['output']>;
  role?: Maybe<Scalars['String']['output']>;
  updated_at?: Maybe<Scalars['String']['output']>;
};

export type WeeklySessionsStats = {
  __typename?: 'WeeklySessionsStats';
  by_day?: Maybe<Scalars['JSON']['output']>;
  total: Scalars['Int']['output'];
};

export type CheckEmailQueryVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type CheckEmailQuery = { __typename?: 'Query', checkEmail: { __typename?: 'EmailCheckResult', exists: boolean, email: string } };

export type VerifyResetTokenQueryVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type VerifyResetTokenQuery = { __typename?: 'Query', verifyResetToken?: { __typename?: 'PasswordResetTokenValidation', valid: boolean, userId?: number | null, expiresAt?: string | null } | null };

export type GetMeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMeQuery = { __typename?: 'Query', me?: { __typename?: 'Users', id: number, first_name: string, last_name: string, email: string, phone?: string | null, birth_date?: string | null, address?: string | null, gender_id?: number | null, role?: string | null, active?: boolean | null, email_verified?: boolean | null, created_at?: string | null, updated_at?: string | null } | null };

export type LoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthResult', success: boolean, message: string, token?: string | null, user?: { __typename?: 'Users', id: number, first_name: string, last_name: string, email: string, phone?: string | null, role?: string | null, active?: boolean | null } | null } };

export type RegisterMutationVariables = Exact<{
  input: RegisterInput;
}>;


export type RegisterMutation = { __typename?: 'Mutation', register: { __typename?: 'AuthResult', success: boolean, message: string, token?: string | null, user?: { __typename?: 'Users', id: number, first_name: string, last_name: string, email: string, phone?: string | null, role?: string | null, active?: boolean | null } | null } };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { __typename?: 'Mutation', logout: { __typename?: 'AuthResult', success: boolean, message: string } };

export type RequestPasswordResetMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type RequestPasswordResetMutation = { __typename?: 'Mutation', requestPasswordReset: { __typename?: 'AuthResult', success: boolean, message: string } };

export type ResetPasswordMutationVariables = Exact<{
  token: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
}>;


export type ResetPasswordMutation = { __typename?: 'Mutation', resetPassword: { __typename?: 'AuthResult', success: boolean, message: string, token?: string | null, user?: { __typename?: 'Users', id: number, first_name: string, last_name: string, email: string } | null } };

export type ChangePasswordMutationVariables = Exact<{
  userId: Scalars['Int']['input'];
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
}>;


export type ChangePasswordMutation = { __typename?: 'Mutation', changePassword: { __typename?: 'AuthResult', success: boolean, message: string, token?: string | null } };

export type GetSessionsQueryVariables = Exact<{
  take?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetSessionsQuery = { __typename?: 'Query', sessions: Array<{ __typename?: 'Sessions', id: number, session_type_id: number, instructor_id: number, date: string, start_time: string, end_time: string, location?: string | null, max_participants?: number | null, current_participants?: number | null, status?: string | null, notes?: string | null, created_at?: string | null }> };

export type GetSessionQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type GetSessionQuery = { __typename?: 'Query', session?: { __typename?: 'Sessions', id: number, session_type_id: number, instructor_id: number, date: string, start_time: string, end_time: string, location?: string | null, max_participants?: number | null, current_participants?: number | null, status?: string | null, notes?: string | null, created_at?: string | null } | null };

export type GetSessionTypesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSessionTypesQuery = { __typename?: 'Query', sessionTypes: Array<{ __typename?: 'SessionTypes', id: number, activity_id: number, name: string, description?: string | null, duration_minutes?: number | null, max_participants?: number | null, price?: number | null, active?: boolean | null }> };

export type GetInstructorsQueryVariables = Exact<{
  take?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetInstructorsQuery = { __typename?: 'Query', instructors: Array<{ __typename?: 'Instructors', id: number, user_id: number, specialization?: string | null, bio?: string | null, certifications?: string | null, active?: boolean | null, created_at?: string | null }> };

export type GetSessionEnrollmentsQueryVariables = Exact<{
  sessionId: Scalars['Int']['input'];
}>;


export type GetSessionEnrollmentsQuery = { __typename?: 'Query', sessionEnrollments: Array<{ __typename?: 'SessionEnrollments', id: number, user_id: number, session_id: number, status?: string | null, enrolled_at?: string | null, notes?: string | null }> };

export type GetUserEnrollmentsQueryVariables = Exact<{
  userId: Scalars['Int']['input'];
}>;


export type GetUserEnrollmentsQuery = { __typename?: 'Query', userEnrollments: Array<{ __typename?: 'SessionEnrollments', id: number, user_id: number, session_id: number, status?: string | null, enrolled_at?: string | null, notes?: string | null }> };

export type CreateSessionMutationVariables = Exact<{
  input: CreateSessionInput;
}>;


export type CreateSessionMutation = { __typename?: 'Mutation', createSession: { __typename?: 'Sessions', id: number, session_type_id: number, instructor_id: number, date: string, start_time: string, end_time: string, location?: string | null, max_participants?: number | null, status?: string | null, created_at?: string | null } };

export type UpdateSessionMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  input: UpdateSessionInput;
}>;


export type UpdateSessionMutation = { __typename?: 'Mutation', updateSession: { __typename?: 'Sessions', id: number, session_type_id: number, instructor_id: number, date: string, start_time: string, end_time: string, location?: string | null, max_participants?: number | null, status?: string | null, notes?: string | null, created_at?: string | null } };

export type DeleteSessionMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteSessionMutation = { __typename?: 'Mutation', deleteSession: { __typename?: 'MutationResult', success: boolean, message: string } };

export type EnrollUserMutationVariables = Exact<{
  userId: Scalars['Int']['input'];
  sessionId: Scalars['Int']['input'];
}>;


export type EnrollUserMutation = { __typename?: 'Mutation', enrollUser: { __typename?: 'SessionEnrollments', id: number, user_id: number, session_id: number, status?: string | null, enrolled_at?: string | null } };

export type CancelEnrollmentMutationVariables = Exact<{
  enrollmentId: Scalars['Int']['input'];
}>;


export type CancelEnrollmentMutation = { __typename?: 'Mutation', cancelEnrollment: { __typename?: 'MutationResult', success: boolean, message: string } };

export type UpdateEnrollmentStatusMutationVariables = Exact<{
  enrollmentId: Scalars['Int']['input'];
  status: Scalars['String']['input'];
}>;


export type UpdateEnrollmentStatusMutation = { __typename?: 'Mutation', updateEnrollmentStatus: { __typename?: 'SessionEnrollments', id: number, user_id: number, session_id: number, status?: string | null, enrolled_at?: string | null } };

export type MessageTypesQueryVariables = Exact<{ [key: string]: never; }>;


export type MessageTypesQuery = { __typename?: 'Query', messageTypes: Array<{ __typename?: 'MessageTypes', id: number, type_name: string, description?: string | null, active?: boolean | null, created_at?: string | null, updated_at?: string | null }> };

export type MessagesReceivedQueryVariables = Exact<{
  userId: Scalars['Int']['input'];
}>;


export type MessagesReceivedQuery = { __typename?: 'Query', messagesReceived: Array<{ __typename?: 'MessageRecipients', id: number, message_id: number, recipient_id: number, read?: boolean | null, read_at?: string | null, deleted?: boolean | null, created_at?: string | null, message?: { __typename?: 'Messages', id: number, sender_id: number, type_message_id?: number | null, subject?: string | null, content: string, sent_at?: string | null, created_at?: string | null, sender?: { __typename?: 'Users', id: number, first_name: string, last_name: string, email: string } | null, messageType?: { __typename?: 'MessageTypes', id: number, type_name: string, description?: string | null } | null } | null }> };

export type MessagesTrashedQueryVariables = Exact<{
  userId: Scalars['Int']['input'];
}>;


export type MessagesTrashedQuery = { __typename?: 'Query', messagesTrashed: Array<{ __typename?: 'MessageRecipients', id: number, message_id: number, recipient_id: number, read?: boolean | null, read_at?: string | null, deleted?: boolean | null, created_at?: string | null, message?: { __typename?: 'Messages', id: number, sender_id: number, type_message_id?: number | null, subject?: string | null, content: string, sent_at?: string | null, created_at?: string | null, sender?: { __typename?: 'Users', id: number, first_name: string, last_name: string, email: string } | null, messageType?: { __typename?: 'MessageTypes', id: number, type_name: string, description?: string | null } | null } | null }> };

export type UnreadMessagesCountQueryVariables = Exact<{
  userId: Scalars['Int']['input'];
}>;


export type UnreadMessagesCountQuery = { __typename?: 'Query', unreadMessagesCount: { __typename?: 'UnreadMessagesCount', count: number } };

export type CreateMessageTypeMutationVariables = Exact<{
  input: CreateMessageTypeInput;
}>;


export type CreateMessageTypeMutation = { __typename?: 'Mutation', createMessageType: { __typename?: 'MessageTypes', id: number, type_name: string, description?: string | null, active?: boolean | null, created_at?: string | null, updated_at?: string | null } };

export type UpdateMessageTypeMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  input: UpdateMessageTypeInput;
}>;


export type UpdateMessageTypeMutation = { __typename?: 'Mutation', updateMessageType: { __typename?: 'MessageTypes', id: number, type_name: string, description?: string | null, active?: boolean | null, created_at?: string | null, updated_at?: string | null } };

export type DeleteMessageTypeMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteMessageTypeMutation = { __typename?: 'Mutation', deleteMessageType: { __typename?: 'MutationResult', success: boolean, message: string } };

export type SendMessageMutationVariables = Exact<{
  input: SendMessageInput;
}>;


export type SendMessageMutation = { __typename?: 'Mutation', sendMessage: { __typename?: 'Messages', id: number, sender_id: number, type_message_id?: number | null, subject?: string | null, content: string, sent_at?: string | null, created_at?: string | null, sender?: { __typename?: 'Users', id: number, first_name: string, last_name: string, email: string } | null } };

export type MarkMessageAsReadMutationVariables = Exact<{
  recipientId: Scalars['Int']['input'];
}>;


export type MarkMessageAsReadMutation = { __typename?: 'Mutation', markMessageAsRead: { __typename?: 'MessageRecipients', id: number, message_id: number, recipient_id: number, read?: boolean | null, read_at?: string | null, deleted?: boolean | null, created_at?: string | null } };

export type DeleteReceivedMessageMutationVariables = Exact<{
  recipientId: Scalars['Int']['input'];
}>;


export type DeleteReceivedMessageMutation = { __typename?: 'Mutation', deleteReceivedMessage: { __typename?: 'MutationResult', success: boolean, message: string } };

export type RestoreMessageMutationVariables = Exact<{
  recipientId: Scalars['Int']['input'];
}>;


export type RestoreMessageMutation = { __typename?: 'Mutation', restoreMessage: { __typename?: 'MessageRecipients', id: number, message_id: number, recipient_id: number, read?: boolean | null, read_at?: string | null, deleted?: boolean | null, created_at?: string | null } };

export type NotificationsQueryVariables = Exact<{
  userId: Scalars['Int']['input'];
}>;


export type NotificationsQuery = { __typename?: 'Query', notifications: Array<{ __typename?: 'Notifications', id: number, user_id: number, title: string, message: string, type: string, read?: boolean | null, read_at?: string | null, created_at?: string | null, user?: { __typename?: 'Users', id: number, first_name: string, last_name: string, email: string } | null }> };

export type CreateNotificationMutationVariables = Exact<{
  input: CreateNotificationInput;
}>;


export type CreateNotificationMutation = { __typename?: 'Mutation', createNotification: { __typename?: 'Notifications', id: number, user_id: number, title: string, message: string, type: string, read?: boolean | null, read_at?: string | null, created_at?: string | null } };

export type MarkNotificationAsReadMutationVariables = Exact<{
  notificationId: Scalars['Int']['input'];
}>;


export type MarkNotificationAsReadMutation = { __typename?: 'Mutation', markNotificationAsRead: { __typename?: 'Notifications', id: number, user_id: number, title: string, message: string, type: string, read?: boolean | null, read_at?: string | null, created_at?: string | null } };

export type GetProductsQueryVariables = Exact<{
  take?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetProductsQuery = { __typename?: 'Query', products: Array<{ __typename?: 'Products', id: number, name: string, description?: string | null, price: number, category_id?: number | null, image_url?: string | null, active?: boolean | null, created_at?: string | null, updated_at?: string | null }> };

export type GetProductQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type GetProductQuery = { __typename?: 'Query', product?: { __typename?: 'Products', id: number, name: string, description?: string | null, price: number, category_id?: number | null, image_url?: string | null, active?: boolean | null, created_at?: string | null, updated_at?: string | null } | null };

export type GetProductCategoriesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetProductCategoriesQuery = { __typename?: 'Query', productCategories: Array<{ __typename?: 'ProductCategories', id: number, name: string, description?: string | null, active?: boolean | null }> };

export type CreateProductMutationVariables = Exact<{
  input: CreateProductInput;
}>;


export type CreateProductMutation = { __typename?: 'Mutation', createProduct: { __typename?: 'Products', id: number, name: string, description?: string | null, price: number, category_id?: number | null, image_url?: string | null, active?: boolean | null, created_at?: string | null } };

export type UpdateProductMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  input: UpdateProductInput;
}>;


export type UpdateProductMutation = { __typename?: 'Mutation', updateProduct: { __typename?: 'Products', id: number, name: string, description?: string | null, price: number, category_id?: number | null, image_url?: string | null, active?: boolean | null, updated_at?: string | null } };

export type DeleteProductMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteProductMutation = { __typename?: 'Mutation', deleteProduct: { __typename?: 'MutationResult', success: boolean, message: string } };

export type GetOrdersQueryVariables = Exact<{
  userId?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetOrdersQuery = { __typename?: 'Query', orders: Array<{ __typename?: 'Orders', id: number, user_id: number, total_amount: number, status: string, delivery_address?: string | null, notes?: string | null, created_at?: string | null, updated_at?: string | null }> };

export type GetOrderQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type GetOrderQuery = { __typename?: 'Query', order?: { __typename?: 'Orders', id: number, user_id: number, total_amount: number, status: string, delivery_address?: string | null, notes?: string | null, created_at?: string | null, updated_at?: string | null } | null };

export type CreateOrderMutationVariables = Exact<{
  input: CreateOrderInput;
}>;


export type CreateOrderMutation = { __typename?: 'Mutation', createOrder: { __typename?: 'Orders', id: number, user_id: number, total_amount: number, status: string, delivery_address?: string | null, created_at?: string | null } };

export type UpdateOrderStatusMutationVariables = Exact<{
  orderId: Scalars['Int']['input'];
  status: Scalars['String']['input'];
}>;


export type UpdateOrderStatusMutation = { __typename?: 'Mutation', updateOrderStatus: { __typename?: 'Orders', id: number, user_id: number, total_amount: number, status: string, updated_at?: string | null } };

export type GetPaymentsQueryVariables = Exact<{
  userId?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetPaymentsQuery = { __typename?: 'Query', payments: Array<{ __typename?: 'Payments', id: number, user_id: number, order_id?: number | null, subscription_id?: number | null, amount: number, payment_method: string, status: string, payment_date?: string | null, stripe_payment_intent_id?: string | null, created_at?: string | null }> };

export type GetPaymentQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type GetPaymentQuery = { __typename?: 'Query', payment?: { __typename?: 'Payments', id: number, user_id: number, order_id?: number | null, subscription_id?: number | null, amount: number, payment_method: string, status: string, payment_date?: string | null, stripe_payment_intent_id?: string | null, created_at?: string | null } | null };

export type CreatePaymentMutationVariables = Exact<{
  input: CreatePaymentInput;
}>;


export type CreatePaymentMutation = { __typename?: 'Mutation', createPayment: { __typename?: 'Payments', id: number, user_id: number, order_id?: number | null, subscription_id?: number | null, amount: number, payment_method: string, status: string, created_at?: string | null } };

export type ProcessPaymentMutationVariables = Exact<{
  paymentId: Scalars['Int']['input'];
}>;


export type ProcessPaymentMutation = { __typename?: 'Mutation', processPayment: { __typename?: 'PaymentResult', success: boolean, message: string, clientSecret?: string | null, payment?: { __typename?: 'Payments', id: number, status: string, payment_date?: string | null } | null } };

export type GetProductStocksQueryVariables = Exact<{
  productId: Scalars['Int']['input'];
}>;


export type GetProductStocksQuery = { __typename?: 'Query', productStocks: Array<{ __typename?: 'ProductStocks', id: number, product_id: number, size_id?: number | null, quantity: number, min_quantity?: number | null, updated_at?: string | null }> };

export type GetStockSizesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetStockSizesQuery = { __typename?: 'Query', stockSizes: Array<{ __typename?: 'StockSizes', id: number, name: string, code?: string | null }> };

export type AttendanceStatsQueryVariables = Exact<{
  userId: Scalars['Int']['input'];
}>;


export type AttendanceStatsQuery = { __typename?: 'Query', attendanceStats?: { __typename?: 'AttendanceStats', user_id: number, total_presences: number, current_month: number, monthly_average: number, last_session?: string | null } | null };

export type TopMembersQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type TopMembersQuery = { __typename?: 'Query', topMembers: Array<{ __typename?: 'TopMemberStats', user_id: number, first_name: string, last_name: string, total_presences: number, attendance_rate: number }> };

export type MembersCountQueryVariables = Exact<{ [key: string]: never; }>;


export type MembersCountQuery = { __typename?: 'Query', membersCount: { __typename?: 'MembersCountStats', count: number } };

export type MembersByGradeQueryVariables = Exact<{ [key: string]: never; }>;


export type MembersByGradeQuery = { __typename?: 'Query', membersByGrade: Array<{ __typename?: 'MembersByGradeStats', grade_name: string, count: number }> };

export type MembersByGenderQueryVariables = Exact<{ [key: string]: never; }>;


export type MembersByGenderQuery = { __typename?: 'Query', membersByGender: Array<{ __typename?: 'MembersByGenderStats', gender_name: string, count: number }> };

export type BirthdaysQueryVariables = Exact<{ [key: string]: never; }>;


export type BirthdaysQuery = { __typename?: 'Query', birthdays: Array<{ __typename?: 'BirthdayInfo', user_id: number, first_name: string, last_name: string, birth_date: string, age: number }> };

export type NewMembersQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type NewMembersQuery = { __typename?: 'Query', newMembers: Array<{ __typename?: 'Users', id: number, first_name: string, last_name: string, email: string, phone?: string | null, birth_date?: string | null, created_at?: string | null }> };

export type TopProductsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type TopProductsQuery = { __typename?: 'Query', topProducts: Array<{ __typename?: 'TopProductStats', product_id: number, name: string, quantity_sold: number, total_revenue: number }> };

export type WeeklySessionsQueryVariables = Exact<{ [key: string]: never; }>;


export type WeeklySessionsQuery = { __typename?: 'Query', weeklySessions: { __typename?: 'WeeklySessionsStats', total: number, by_day?: Record<string, unknown> | null } };

export type MonthlyPaymentsQueryVariables = Exact<{ [key: string]: never; }>;


export type MonthlyPaymentsQuery = { __typename?: 'Query', monthlyPayments: { __typename?: 'MonthlyPaymentsStats', total: number, count: number } };

export type RecentPaymentsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type RecentPaymentsQuery = { __typename?: 'Query', recentPayments: Array<{ __typename?: 'PaymentInfo', id: number, user_id: number, amount: number, payment_date: string, status: string, user_first_name?: string | null, user_last_name?: string | null }> };

export type PendingPaymentsQueryVariables = Exact<{ [key: string]: never; }>;


export type PendingPaymentsQuery = { __typename?: 'Query', pendingPayments: Array<{ __typename?: 'PaymentInfo', id: number, user_id: number, amount: number, payment_date: string, status: string, user_first_name?: string | null, user_last_name?: string | null }> };

export type OverduePaymentsQueryVariables = Exact<{ [key: string]: never; }>;


export type OverduePaymentsQuery = { __typename?: 'Query', overduePayments: Array<{ __typename?: 'PaymentInfo', id: number, user_id: number, amount: number, payment_date: string, status: string, user_first_name?: string | null, user_last_name?: string | null }> };

export type LastPaymentsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type LastPaymentsQuery = { __typename?: 'Query', lastPayments: Array<{ __typename?: 'PaymentInfo', id: number, user_id: number, amount: number, payment_date: string, status: string, user_first_name?: string | null, user_last_name?: string | null }> };

export type PaymentsByMonthQueryVariables = Exact<{ [key: string]: never; }>;


export type PaymentsByMonthQuery = { __typename?: 'Query', paymentsByMonth: Array<{ __typename?: 'MonthlyPaymentsBreakdown', month: string, total: number, count: number }> };

export type ActivePlansQueryVariables = Exact<{ [key: string]: never; }>;


export type ActivePlansQuery = { __typename?: 'Query', activePlans: Array<{ __typename?: 'ActivePlanStats', plan_name: string, count: number }> };

export type RenewalRateQueryVariables = Exact<{ [key: string]: never; }>;


export type RenewalRateQuery = { __typename?: 'Query', renewalRate: { __typename?: 'RenewalRateStats', rate: number } };

export type MembersByPlanQueryVariables = Exact<{ [key: string]: never; }>;


export type MembersByPlanQuery = { __typename?: 'Query', membersByPlan: Array<{ __typename?: 'MembersByPlanStats', plan_name: string, count: number }> };

export type GetUsersQueryVariables = Exact<{
  take?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetUsersQuery = { __typename?: 'Query', users: Array<{ __typename?: 'Users', id: number, first_name: string, last_name: string, email: string, phone?: string | null, birth_date?: string | null, address?: string | null, gender_id?: number | null, role?: string | null, active?: boolean | null, email_verified?: boolean | null, created_at?: string | null, updated_at?: string | null }> };

export type GetUserQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type GetUserQuery = { __typename?: 'Query', user?: { __typename?: 'Users', id: number, first_name: string, last_name: string, email: string, phone?: string | null, birth_date?: string | null, address?: string | null, gender_id?: number | null, role?: string | null, active?: boolean | null, email_verified?: boolean | null, created_at?: string | null, updated_at?: string | null } | null };

export type CreateUserMutationVariables = Exact<{
  input: CreateUserInput;
}>;


export type CreateUserMutation = { __typename?: 'Mutation', createUser: { __typename?: 'Users', id: number, first_name: string, last_name: string, email: string, phone?: string | null, role?: string | null, active?: boolean | null, created_at?: string | null } };

export type UpdateUserMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  input: UpdateUserInput;
}>;


export type UpdateUserMutation = { __typename?: 'Mutation', updateUser: { __typename?: 'Users', id: number, first_name: string, last_name: string, email: string, phone?: string | null, birth_date?: string | null, address?: string | null, active?: boolean | null, updated_at?: string | null } };

export type DeleteUserMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type DeleteUserMutation = { __typename?: 'Mutation', deleteUser: { __typename?: 'MutationResult', success: boolean, message: string } };

export type GetSubscriptionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSubscriptionsQuery = { __typename?: 'Query', subscriptions: Array<{ __typename?: 'SubscriptionPlans', id: number, subscription_name: string, price: number, duration_months: number, description?: string | null, active?: boolean | null, created_at?: string | null, updated_at?: string | null }> };

export type GetSubscriptionQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type GetSubscriptionQuery = { __typename?: 'Query', subscription?: { __typename?: 'SubscriptionPlans', id: number, subscription_name: string, price: number, duration_months: number, description?: string | null, active?: boolean | null, created_at?: string | null, updated_at?: string | null } | null };

export type GetGradesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetGradesQuery = { __typename?: 'Query', grades: Array<{ __typename?: 'Grades', id: number, grade_name: string, description?: string | null, level_order?: number | null, active?: boolean | null, created_at?: string | null, updated_at?: string | null }> };

export type GetGradeQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type GetGradeQuery = { __typename?: 'Query', grade?: { __typename?: 'Grades', id: number, grade_name: string, description?: string | null, level_order?: number | null, active?: boolean | null, created_at?: string | null, updated_at?: string | null } | null };

export type GetStatusesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetStatusesQuery = { __typename?: 'Query', statuses: Array<{ __typename?: 'Statuses', id: number, status_name: string, description?: string | null, active?: boolean | null, created_at?: string | null, updated_at?: string | null }> };

export type GetStatusQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type GetStatusQuery = { __typename?: 'Query', status?: { __typename?: 'Statuses', id: number, status_name: string, description?: string | null, active?: boolean | null, created_at?: string | null, updated_at?: string | null } | null };

export type GetGendersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetGendersQuery = { __typename?: 'Query', genders: Array<{ __typename?: 'Genders', id: number, gender_name: string, active?: boolean | null, created_at?: string | null, updated_at?: string | null }> };

export type GetGenderQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type GetGenderQuery = { __typename?: 'Query', gender?: { __typename?: 'Genders', id: number, gender_name: string, active?: boolean | null, created_at?: string | null, updated_at?: string | null } | null };

export type GetUserSubscriptionQueryVariables = Exact<{
  userId: Scalars['Int']['input'];
}>;


export type GetUserSubscriptionQuery = { __typename?: 'Query', userSubscription?: { __typename?: 'UserSubscriptions', id: number, user_id: number, subscription_id: number, start_date: string, end_date: string, active?: boolean | null, created_at?: string | null, updated_at?: string | null, subscription?: { __typename?: 'SubscriptionPlans', id: number, subscription_name: string, price: number, duration_months: number } | null } | null };


export const CheckEmailDocument = gql`
    query CheckEmail($email: String!) {
  checkEmail(email: $email) {
    exists
    email
  }
}
    `;

/**
 * __useCheckEmailQuery__
 *
 * To run a query within a React component, call `useCheckEmailQuery` and pass it any options that fit your needs.
 * When your component renders, `useCheckEmailQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCheckEmailQuery({
 *   variables: {
 *      email: // value for 'email'
 *   },
 * });
 */
export function useCheckEmailQuery(baseOptions: Apollo.QueryHookOptions<CheckEmailQuery, CheckEmailQueryVariables> & ({ variables: CheckEmailQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CheckEmailQuery, CheckEmailQueryVariables>(CheckEmailDocument, options);
      }
export function useCheckEmailLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CheckEmailQuery, CheckEmailQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CheckEmailQuery, CheckEmailQueryVariables>(CheckEmailDocument, options);
        }
// @ts-ignore
export function useCheckEmailSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<CheckEmailQuery, CheckEmailQueryVariables>): Apollo.UseSuspenseQueryResult<CheckEmailQuery, CheckEmailQueryVariables>;
export function useCheckEmailSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CheckEmailQuery, CheckEmailQueryVariables>): Apollo.UseSuspenseQueryResult<CheckEmailQuery | undefined, CheckEmailQueryVariables>;
export function useCheckEmailSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CheckEmailQuery, CheckEmailQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<CheckEmailQuery, CheckEmailQueryVariables>(CheckEmailDocument, options);
        }
export type CheckEmailQueryHookResult = ReturnType<typeof useCheckEmailQuery>;
export type CheckEmailLazyQueryHookResult = ReturnType<typeof useCheckEmailLazyQuery>;
export type CheckEmailSuspenseQueryHookResult = ReturnType<typeof useCheckEmailSuspenseQuery>;
export type CheckEmailQueryResult = Apollo.QueryResult<CheckEmailQuery, CheckEmailQueryVariables>;
export const VerifyResetTokenDocument = gql`
    query VerifyResetToken($token: String!) {
  verifyResetToken(token: $token) {
    valid
    userId
    expiresAt
  }
}
    `;

/**
 * __useVerifyResetTokenQuery__
 *
 * To run a query within a React component, call `useVerifyResetTokenQuery` and pass it any options that fit your needs.
 * When your component renders, `useVerifyResetTokenQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useVerifyResetTokenQuery({
 *   variables: {
 *      token: // value for 'token'
 *   },
 * });
 */
export function useVerifyResetTokenQuery(baseOptions: Apollo.QueryHookOptions<VerifyResetTokenQuery, VerifyResetTokenQueryVariables> & ({ variables: VerifyResetTokenQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<VerifyResetTokenQuery, VerifyResetTokenQueryVariables>(VerifyResetTokenDocument, options);
      }
export function useVerifyResetTokenLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<VerifyResetTokenQuery, VerifyResetTokenQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<VerifyResetTokenQuery, VerifyResetTokenQueryVariables>(VerifyResetTokenDocument, options);
        }
// @ts-ignore
export function useVerifyResetTokenSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<VerifyResetTokenQuery, VerifyResetTokenQueryVariables>): Apollo.UseSuspenseQueryResult<VerifyResetTokenQuery, VerifyResetTokenQueryVariables>;
export function useVerifyResetTokenSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<VerifyResetTokenQuery, VerifyResetTokenQueryVariables>): Apollo.UseSuspenseQueryResult<VerifyResetTokenQuery | undefined, VerifyResetTokenQueryVariables>;
export function useVerifyResetTokenSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<VerifyResetTokenQuery, VerifyResetTokenQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<VerifyResetTokenQuery, VerifyResetTokenQueryVariables>(VerifyResetTokenDocument, options);
        }
export type VerifyResetTokenQueryHookResult = ReturnType<typeof useVerifyResetTokenQuery>;
export type VerifyResetTokenLazyQueryHookResult = ReturnType<typeof useVerifyResetTokenLazyQuery>;
export type VerifyResetTokenSuspenseQueryHookResult = ReturnType<typeof useVerifyResetTokenSuspenseQuery>;
export type VerifyResetTokenQueryResult = Apollo.QueryResult<VerifyResetTokenQuery, VerifyResetTokenQueryVariables>;
export const GetMeDocument = gql`
    query GetMe {
  me {
    id
    first_name
    last_name
    email
    phone
    birth_date
    address
    gender_id
    role
    active
    email_verified
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetMeQuery__
 *
 * To run a query within a React component, call `useGetMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMeQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetMeQuery(baseOptions?: Apollo.QueryHookOptions<GetMeQuery, GetMeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetMeQuery, GetMeQueryVariables>(GetMeDocument, options);
      }
export function useGetMeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetMeQuery, GetMeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetMeQuery, GetMeQueryVariables>(GetMeDocument, options);
        }
// @ts-ignore
export function useGetMeSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetMeQuery, GetMeQueryVariables>): Apollo.UseSuspenseQueryResult<GetMeQuery, GetMeQueryVariables>;
export function useGetMeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetMeQuery, GetMeQueryVariables>): Apollo.UseSuspenseQueryResult<GetMeQuery | undefined, GetMeQueryVariables>;
export function useGetMeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetMeQuery, GetMeQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetMeQuery, GetMeQueryVariables>(GetMeDocument, options);
        }
export type GetMeQueryHookResult = ReturnType<typeof useGetMeQuery>;
export type GetMeLazyQueryHookResult = ReturnType<typeof useGetMeLazyQuery>;
export type GetMeSuspenseQueryHookResult = ReturnType<typeof useGetMeSuspenseQuery>;
export type GetMeQueryResult = Apollo.QueryResult<GetMeQuery, GetMeQueryVariables>;
export const LoginDocument = gql`
    mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    success
    message
    token
    user {
      id
      first_name
      last_name
      email
      phone
      role
      active
    }
  }
}
    `;
export type LoginMutationFn = Apollo.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      email: // value for 'email'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useLoginMutation(baseOptions?: Apollo.MutationHookOptions<LoginMutation, LoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, options);
      }
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutation>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<LoginMutation, LoginMutationVariables>;
export const RegisterDocument = gql`
    mutation Register($input: RegisterInput!) {
  register(input: $input) {
    success
    message
    token
    user {
      id
      first_name
      last_name
      email
      phone
      role
      active
    }
  }
}
    `;
export type RegisterMutationFn = Apollo.MutationFunction<RegisterMutation, RegisterMutationVariables>;

/**
 * __useRegisterMutation__
 *
 * To run a mutation, you first call `useRegisterMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerMutation, { data, loading, error }] = useRegisterMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRegisterMutation(baseOptions?: Apollo.MutationHookOptions<RegisterMutation, RegisterMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RegisterMutation, RegisterMutationVariables>(RegisterDocument, options);
      }
export type RegisterMutationHookResult = ReturnType<typeof useRegisterMutation>;
export type RegisterMutationResult = Apollo.MutationResult<RegisterMutation>;
export type RegisterMutationOptions = Apollo.BaseMutationOptions<RegisterMutation, RegisterMutationVariables>;
export const LogoutDocument = gql`
    mutation Logout {
  logout {
    success
    message
  }
}
    `;
export type LogoutMutationFn = Apollo.MutationFunction<LogoutMutation, LogoutMutationVariables>;

/**
 * __useLogoutMutation__
 *
 * To run a mutation, you first call `useLogoutMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLogoutMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [logoutMutation, { data, loading, error }] = useLogoutMutation({
 *   variables: {
 *   },
 * });
 */
export function useLogoutMutation(baseOptions?: Apollo.MutationHookOptions<LogoutMutation, LogoutMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LogoutMutation, LogoutMutationVariables>(LogoutDocument, options);
      }
export type LogoutMutationHookResult = ReturnType<typeof useLogoutMutation>;
export type LogoutMutationResult = Apollo.MutationResult<LogoutMutation>;
export type LogoutMutationOptions = Apollo.BaseMutationOptions<LogoutMutation, LogoutMutationVariables>;
export const RequestPasswordResetDocument = gql`
    mutation RequestPasswordReset($email: String!) {
  requestPasswordReset(email: $email) {
    success
    message
  }
}
    `;
export type RequestPasswordResetMutationFn = Apollo.MutationFunction<RequestPasswordResetMutation, RequestPasswordResetMutationVariables>;

/**
 * __useRequestPasswordResetMutation__
 *
 * To run a mutation, you first call `useRequestPasswordResetMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRequestPasswordResetMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [requestPasswordResetMutation, { data, loading, error }] = useRequestPasswordResetMutation({
 *   variables: {
 *      email: // value for 'email'
 *   },
 * });
 */
export function useRequestPasswordResetMutation(baseOptions?: Apollo.MutationHookOptions<RequestPasswordResetMutation, RequestPasswordResetMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RequestPasswordResetMutation, RequestPasswordResetMutationVariables>(RequestPasswordResetDocument, options);
      }
export type RequestPasswordResetMutationHookResult = ReturnType<typeof useRequestPasswordResetMutation>;
export type RequestPasswordResetMutationResult = Apollo.MutationResult<RequestPasswordResetMutation>;
export type RequestPasswordResetMutationOptions = Apollo.BaseMutationOptions<RequestPasswordResetMutation, RequestPasswordResetMutationVariables>;
export const ResetPasswordDocument = gql`
    mutation ResetPassword($token: String!, $newPassword: String!) {
  resetPassword(token: $token, newPassword: $newPassword) {
    success
    message
    token
    user {
      id
      first_name
      last_name
      email
    }
  }
}
    `;
export type ResetPasswordMutationFn = Apollo.MutationFunction<ResetPasswordMutation, ResetPasswordMutationVariables>;

/**
 * __useResetPasswordMutation__
 *
 * To run a mutation, you first call `useResetPasswordMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useResetPasswordMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [resetPasswordMutation, { data, loading, error }] = useResetPasswordMutation({
 *   variables: {
 *      token: // value for 'token'
 *      newPassword: // value for 'newPassword'
 *   },
 * });
 */
export function useResetPasswordMutation(baseOptions?: Apollo.MutationHookOptions<ResetPasswordMutation, ResetPasswordMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ResetPasswordMutation, ResetPasswordMutationVariables>(ResetPasswordDocument, options);
      }
export type ResetPasswordMutationHookResult = ReturnType<typeof useResetPasswordMutation>;
export type ResetPasswordMutationResult = Apollo.MutationResult<ResetPasswordMutation>;
export type ResetPasswordMutationOptions = Apollo.BaseMutationOptions<ResetPasswordMutation, ResetPasswordMutationVariables>;
export const ChangePasswordDocument = gql`
    mutation ChangePassword($userId: Int!, $currentPassword: String!, $newPassword: String!) {
  changePassword(
    userId: $userId
    currentPassword: $currentPassword
    newPassword: $newPassword
  ) {
    success
    message
    token
  }
}
    `;
export type ChangePasswordMutationFn = Apollo.MutationFunction<ChangePasswordMutation, ChangePasswordMutationVariables>;

/**
 * __useChangePasswordMutation__
 *
 * To run a mutation, you first call `useChangePasswordMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useChangePasswordMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [changePasswordMutation, { data, loading, error }] = useChangePasswordMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *      currentPassword: // value for 'currentPassword'
 *      newPassword: // value for 'newPassword'
 *   },
 * });
 */
export function useChangePasswordMutation(baseOptions?: Apollo.MutationHookOptions<ChangePasswordMutation, ChangePasswordMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ChangePasswordMutation, ChangePasswordMutationVariables>(ChangePasswordDocument, options);
      }
export type ChangePasswordMutationHookResult = ReturnType<typeof useChangePasswordMutation>;
export type ChangePasswordMutationResult = Apollo.MutationResult<ChangePasswordMutation>;
export type ChangePasswordMutationOptions = Apollo.BaseMutationOptions<ChangePasswordMutation, ChangePasswordMutationVariables>;
export const GetSessionsDocument = gql`
    query GetSessions($take: Int, $skip: Int) {
  sessions(take: $take, skip: $skip) {
    id
    session_type_id
    instructor_id
    date
    start_time
    end_time
    location
    max_participants
    current_participants
    status
    notes
    created_at
  }
}
    `;

/**
 * __useGetSessionsQuery__
 *
 * To run a query within a React component, call `useGetSessionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSessionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSessionsQuery({
 *   variables: {
 *      take: // value for 'take'
 *      skip: // value for 'skip'
 *   },
 * });
 */
export function useGetSessionsQuery(baseOptions?: Apollo.QueryHookOptions<GetSessionsQuery, GetSessionsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSessionsQuery, GetSessionsQueryVariables>(GetSessionsDocument, options);
      }
export function useGetSessionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSessionsQuery, GetSessionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSessionsQuery, GetSessionsQueryVariables>(GetSessionsDocument, options);
        }
// @ts-ignore
export function useGetSessionsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetSessionsQuery, GetSessionsQueryVariables>): Apollo.UseSuspenseQueryResult<GetSessionsQuery, GetSessionsQueryVariables>;
export function useGetSessionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSessionsQuery, GetSessionsQueryVariables>): Apollo.UseSuspenseQueryResult<GetSessionsQuery | undefined, GetSessionsQueryVariables>;
export function useGetSessionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSessionsQuery, GetSessionsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetSessionsQuery, GetSessionsQueryVariables>(GetSessionsDocument, options);
        }
export type GetSessionsQueryHookResult = ReturnType<typeof useGetSessionsQuery>;
export type GetSessionsLazyQueryHookResult = ReturnType<typeof useGetSessionsLazyQuery>;
export type GetSessionsSuspenseQueryHookResult = ReturnType<typeof useGetSessionsSuspenseQuery>;
export type GetSessionsQueryResult = Apollo.QueryResult<GetSessionsQuery, GetSessionsQueryVariables>;
export const GetSessionDocument = gql`
    query GetSession($id: Int!) {
  session(id: $id) {
    id
    session_type_id
    instructor_id
    date
    start_time
    end_time
    location
    max_participants
    current_participants
    status
    notes
    created_at
  }
}
    `;

/**
 * __useGetSessionQuery__
 *
 * To run a query within a React component, call `useGetSessionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSessionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSessionQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetSessionQuery(baseOptions: Apollo.QueryHookOptions<GetSessionQuery, GetSessionQueryVariables> & ({ variables: GetSessionQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSessionQuery, GetSessionQueryVariables>(GetSessionDocument, options);
      }
export function useGetSessionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSessionQuery, GetSessionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSessionQuery, GetSessionQueryVariables>(GetSessionDocument, options);
        }
// @ts-ignore
export function useGetSessionSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetSessionQuery, GetSessionQueryVariables>): Apollo.UseSuspenseQueryResult<GetSessionQuery, GetSessionQueryVariables>;
export function useGetSessionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSessionQuery, GetSessionQueryVariables>): Apollo.UseSuspenseQueryResult<GetSessionQuery | undefined, GetSessionQueryVariables>;
export function useGetSessionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSessionQuery, GetSessionQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetSessionQuery, GetSessionQueryVariables>(GetSessionDocument, options);
        }
export type GetSessionQueryHookResult = ReturnType<typeof useGetSessionQuery>;
export type GetSessionLazyQueryHookResult = ReturnType<typeof useGetSessionLazyQuery>;
export type GetSessionSuspenseQueryHookResult = ReturnType<typeof useGetSessionSuspenseQuery>;
export type GetSessionQueryResult = Apollo.QueryResult<GetSessionQuery, GetSessionQueryVariables>;
export const GetSessionTypesDocument = gql`
    query GetSessionTypes {
  sessionTypes {
    id
    activity_id
    name
    description
    duration_minutes
    max_participants
    price
    active
  }
}
    `;

/**
 * __useGetSessionTypesQuery__
 *
 * To run a query within a React component, call `useGetSessionTypesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSessionTypesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSessionTypesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetSessionTypesQuery(baseOptions?: Apollo.QueryHookOptions<GetSessionTypesQuery, GetSessionTypesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSessionTypesQuery, GetSessionTypesQueryVariables>(GetSessionTypesDocument, options);
      }
export function useGetSessionTypesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSessionTypesQuery, GetSessionTypesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSessionTypesQuery, GetSessionTypesQueryVariables>(GetSessionTypesDocument, options);
        }
// @ts-ignore
export function useGetSessionTypesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetSessionTypesQuery, GetSessionTypesQueryVariables>): Apollo.UseSuspenseQueryResult<GetSessionTypesQuery, GetSessionTypesQueryVariables>;
export function useGetSessionTypesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSessionTypesQuery, GetSessionTypesQueryVariables>): Apollo.UseSuspenseQueryResult<GetSessionTypesQuery | undefined, GetSessionTypesQueryVariables>;
export function useGetSessionTypesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSessionTypesQuery, GetSessionTypesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetSessionTypesQuery, GetSessionTypesQueryVariables>(GetSessionTypesDocument, options);
        }
export type GetSessionTypesQueryHookResult = ReturnType<typeof useGetSessionTypesQuery>;
export type GetSessionTypesLazyQueryHookResult = ReturnType<typeof useGetSessionTypesLazyQuery>;
export type GetSessionTypesSuspenseQueryHookResult = ReturnType<typeof useGetSessionTypesSuspenseQuery>;
export type GetSessionTypesQueryResult = Apollo.QueryResult<GetSessionTypesQuery, GetSessionTypesQueryVariables>;
export const GetInstructorsDocument = gql`
    query GetInstructors($take: Int, $skip: Int) {
  instructors(take: $take, skip: $skip) {
    id
    user_id
    specialization
    bio
    certifications
    active
    created_at
  }
}
    `;

/**
 * __useGetInstructorsQuery__
 *
 * To run a query within a React component, call `useGetInstructorsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetInstructorsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetInstructorsQuery({
 *   variables: {
 *      take: // value for 'take'
 *      skip: // value for 'skip'
 *   },
 * });
 */
export function useGetInstructorsQuery(baseOptions?: Apollo.QueryHookOptions<GetInstructorsQuery, GetInstructorsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetInstructorsQuery, GetInstructorsQueryVariables>(GetInstructorsDocument, options);
      }
export function useGetInstructorsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetInstructorsQuery, GetInstructorsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetInstructorsQuery, GetInstructorsQueryVariables>(GetInstructorsDocument, options);
        }
// @ts-ignore
export function useGetInstructorsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetInstructorsQuery, GetInstructorsQueryVariables>): Apollo.UseSuspenseQueryResult<GetInstructorsQuery, GetInstructorsQueryVariables>;
export function useGetInstructorsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetInstructorsQuery, GetInstructorsQueryVariables>): Apollo.UseSuspenseQueryResult<GetInstructorsQuery | undefined, GetInstructorsQueryVariables>;
export function useGetInstructorsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetInstructorsQuery, GetInstructorsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetInstructorsQuery, GetInstructorsQueryVariables>(GetInstructorsDocument, options);
        }
export type GetInstructorsQueryHookResult = ReturnType<typeof useGetInstructorsQuery>;
export type GetInstructorsLazyQueryHookResult = ReturnType<typeof useGetInstructorsLazyQuery>;
export type GetInstructorsSuspenseQueryHookResult = ReturnType<typeof useGetInstructorsSuspenseQuery>;
export type GetInstructorsQueryResult = Apollo.QueryResult<GetInstructorsQuery, GetInstructorsQueryVariables>;
export const GetSessionEnrollmentsDocument = gql`
    query GetSessionEnrollments($sessionId: Int!) {
  sessionEnrollments(sessionId: $sessionId) {
    id
    user_id
    session_id
    status
    enrolled_at
    notes
  }
}
    `;

/**
 * __useGetSessionEnrollmentsQuery__
 *
 * To run a query within a React component, call `useGetSessionEnrollmentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSessionEnrollmentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSessionEnrollmentsQuery({
 *   variables: {
 *      sessionId: // value for 'sessionId'
 *   },
 * });
 */
export function useGetSessionEnrollmentsQuery(baseOptions: Apollo.QueryHookOptions<GetSessionEnrollmentsQuery, GetSessionEnrollmentsQueryVariables> & ({ variables: GetSessionEnrollmentsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSessionEnrollmentsQuery, GetSessionEnrollmentsQueryVariables>(GetSessionEnrollmentsDocument, options);
      }
export function useGetSessionEnrollmentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSessionEnrollmentsQuery, GetSessionEnrollmentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSessionEnrollmentsQuery, GetSessionEnrollmentsQueryVariables>(GetSessionEnrollmentsDocument, options);
        }
// @ts-ignore
export function useGetSessionEnrollmentsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetSessionEnrollmentsQuery, GetSessionEnrollmentsQueryVariables>): Apollo.UseSuspenseQueryResult<GetSessionEnrollmentsQuery, GetSessionEnrollmentsQueryVariables>;
export function useGetSessionEnrollmentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSessionEnrollmentsQuery, GetSessionEnrollmentsQueryVariables>): Apollo.UseSuspenseQueryResult<GetSessionEnrollmentsQuery | undefined, GetSessionEnrollmentsQueryVariables>;
export function useGetSessionEnrollmentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSessionEnrollmentsQuery, GetSessionEnrollmentsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetSessionEnrollmentsQuery, GetSessionEnrollmentsQueryVariables>(GetSessionEnrollmentsDocument, options);
        }
export type GetSessionEnrollmentsQueryHookResult = ReturnType<typeof useGetSessionEnrollmentsQuery>;
export type GetSessionEnrollmentsLazyQueryHookResult = ReturnType<typeof useGetSessionEnrollmentsLazyQuery>;
export type GetSessionEnrollmentsSuspenseQueryHookResult = ReturnType<typeof useGetSessionEnrollmentsSuspenseQuery>;
export type GetSessionEnrollmentsQueryResult = Apollo.QueryResult<GetSessionEnrollmentsQuery, GetSessionEnrollmentsQueryVariables>;
export const GetUserEnrollmentsDocument = gql`
    query GetUserEnrollments($userId: Int!) {
  userEnrollments(userId: $userId) {
    id
    user_id
    session_id
    status
    enrolled_at
    notes
  }
}
    `;

/**
 * __useGetUserEnrollmentsQuery__
 *
 * To run a query within a React component, call `useGetUserEnrollmentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserEnrollmentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserEnrollmentsQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetUserEnrollmentsQuery(baseOptions: Apollo.QueryHookOptions<GetUserEnrollmentsQuery, GetUserEnrollmentsQueryVariables> & ({ variables: GetUserEnrollmentsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUserEnrollmentsQuery, GetUserEnrollmentsQueryVariables>(GetUserEnrollmentsDocument, options);
      }
export function useGetUserEnrollmentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUserEnrollmentsQuery, GetUserEnrollmentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUserEnrollmentsQuery, GetUserEnrollmentsQueryVariables>(GetUserEnrollmentsDocument, options);
        }
// @ts-ignore
export function useGetUserEnrollmentsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetUserEnrollmentsQuery, GetUserEnrollmentsQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserEnrollmentsQuery, GetUserEnrollmentsQueryVariables>;
export function useGetUserEnrollmentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserEnrollmentsQuery, GetUserEnrollmentsQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserEnrollmentsQuery | undefined, GetUserEnrollmentsQueryVariables>;
export function useGetUserEnrollmentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserEnrollmentsQuery, GetUserEnrollmentsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetUserEnrollmentsQuery, GetUserEnrollmentsQueryVariables>(GetUserEnrollmentsDocument, options);
        }
export type GetUserEnrollmentsQueryHookResult = ReturnType<typeof useGetUserEnrollmentsQuery>;
export type GetUserEnrollmentsLazyQueryHookResult = ReturnType<typeof useGetUserEnrollmentsLazyQuery>;
export type GetUserEnrollmentsSuspenseQueryHookResult = ReturnType<typeof useGetUserEnrollmentsSuspenseQuery>;
export type GetUserEnrollmentsQueryResult = Apollo.QueryResult<GetUserEnrollmentsQuery, GetUserEnrollmentsQueryVariables>;
export const CreateSessionDocument = gql`
    mutation CreateSession($input: CreateSessionInput!) {
  createSession(input: $input) {
    id
    session_type_id
    instructor_id
    date
    start_time
    end_time
    location
    max_participants
    status
    created_at
  }
}
    `;
export type CreateSessionMutationFn = Apollo.MutationFunction<CreateSessionMutation, CreateSessionMutationVariables>;

/**
 * __useCreateSessionMutation__
 *
 * To run a mutation, you first call `useCreateSessionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateSessionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createSessionMutation, { data, loading, error }] = useCreateSessionMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateSessionMutation(baseOptions?: Apollo.MutationHookOptions<CreateSessionMutation, CreateSessionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateSessionMutation, CreateSessionMutationVariables>(CreateSessionDocument, options);
      }
export type CreateSessionMutationHookResult = ReturnType<typeof useCreateSessionMutation>;
export type CreateSessionMutationResult = Apollo.MutationResult<CreateSessionMutation>;
export type CreateSessionMutationOptions = Apollo.BaseMutationOptions<CreateSessionMutation, CreateSessionMutationVariables>;
export const UpdateSessionDocument = gql`
    mutation UpdateSession($id: Int!, $input: UpdateSessionInput!) {
  updateSession(id: $id, input: $input) {
    id
    session_type_id
    instructor_id
    date
    start_time
    end_time
    location
    max_participants
    status
    notes
    created_at
  }
}
    `;
export type UpdateSessionMutationFn = Apollo.MutationFunction<UpdateSessionMutation, UpdateSessionMutationVariables>;

/**
 * __useUpdateSessionMutation__
 *
 * To run a mutation, you first call `useUpdateSessionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateSessionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateSessionMutation, { data, loading, error }] = useUpdateSessionMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateSessionMutation(baseOptions?: Apollo.MutationHookOptions<UpdateSessionMutation, UpdateSessionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateSessionMutation, UpdateSessionMutationVariables>(UpdateSessionDocument, options);
      }
export type UpdateSessionMutationHookResult = ReturnType<typeof useUpdateSessionMutation>;
export type UpdateSessionMutationResult = Apollo.MutationResult<UpdateSessionMutation>;
export type UpdateSessionMutationOptions = Apollo.BaseMutationOptions<UpdateSessionMutation, UpdateSessionMutationVariables>;
export const DeleteSessionDocument = gql`
    mutation DeleteSession($id: Int!) {
  deleteSession(id: $id) {
    success
    message
  }
}
    `;
export type DeleteSessionMutationFn = Apollo.MutationFunction<DeleteSessionMutation, DeleteSessionMutationVariables>;

/**
 * __useDeleteSessionMutation__
 *
 * To run a mutation, you first call `useDeleteSessionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteSessionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteSessionMutation, { data, loading, error }] = useDeleteSessionMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteSessionMutation(baseOptions?: Apollo.MutationHookOptions<DeleteSessionMutation, DeleteSessionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteSessionMutation, DeleteSessionMutationVariables>(DeleteSessionDocument, options);
      }
export type DeleteSessionMutationHookResult = ReturnType<typeof useDeleteSessionMutation>;
export type DeleteSessionMutationResult = Apollo.MutationResult<DeleteSessionMutation>;
export type DeleteSessionMutationOptions = Apollo.BaseMutationOptions<DeleteSessionMutation, DeleteSessionMutationVariables>;
export const EnrollUserDocument = gql`
    mutation EnrollUser($userId: Int!, $sessionId: Int!) {
  enrollUser(userId: $userId, sessionId: $sessionId) {
    id
    user_id
    session_id
    status
    enrolled_at
  }
}
    `;
export type EnrollUserMutationFn = Apollo.MutationFunction<EnrollUserMutation, EnrollUserMutationVariables>;

/**
 * __useEnrollUserMutation__
 *
 * To run a mutation, you first call `useEnrollUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useEnrollUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [enrollUserMutation, { data, loading, error }] = useEnrollUserMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *      sessionId: // value for 'sessionId'
 *   },
 * });
 */
export function useEnrollUserMutation(baseOptions?: Apollo.MutationHookOptions<EnrollUserMutation, EnrollUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<EnrollUserMutation, EnrollUserMutationVariables>(EnrollUserDocument, options);
      }
export type EnrollUserMutationHookResult = ReturnType<typeof useEnrollUserMutation>;
export type EnrollUserMutationResult = Apollo.MutationResult<EnrollUserMutation>;
export type EnrollUserMutationOptions = Apollo.BaseMutationOptions<EnrollUserMutation, EnrollUserMutationVariables>;
export const CancelEnrollmentDocument = gql`
    mutation CancelEnrollment($enrollmentId: Int!) {
  cancelEnrollment(enrollmentId: $enrollmentId) {
    success
    message
  }
}
    `;
export type CancelEnrollmentMutationFn = Apollo.MutationFunction<CancelEnrollmentMutation, CancelEnrollmentMutationVariables>;

/**
 * __useCancelEnrollmentMutation__
 *
 * To run a mutation, you first call `useCancelEnrollmentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCancelEnrollmentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cancelEnrollmentMutation, { data, loading, error }] = useCancelEnrollmentMutation({
 *   variables: {
 *      enrollmentId: // value for 'enrollmentId'
 *   },
 * });
 */
export function useCancelEnrollmentMutation(baseOptions?: Apollo.MutationHookOptions<CancelEnrollmentMutation, CancelEnrollmentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CancelEnrollmentMutation, CancelEnrollmentMutationVariables>(CancelEnrollmentDocument, options);
      }
export type CancelEnrollmentMutationHookResult = ReturnType<typeof useCancelEnrollmentMutation>;
export type CancelEnrollmentMutationResult = Apollo.MutationResult<CancelEnrollmentMutation>;
export type CancelEnrollmentMutationOptions = Apollo.BaseMutationOptions<CancelEnrollmentMutation, CancelEnrollmentMutationVariables>;
export const UpdateEnrollmentStatusDocument = gql`
    mutation UpdateEnrollmentStatus($enrollmentId: Int!, $status: String!) {
  updateEnrollmentStatus(enrollmentId: $enrollmentId, status: $status) {
    id
    user_id
    session_id
    status
    enrolled_at
  }
}
    `;
export type UpdateEnrollmentStatusMutationFn = Apollo.MutationFunction<UpdateEnrollmentStatusMutation, UpdateEnrollmentStatusMutationVariables>;

/**
 * __useUpdateEnrollmentStatusMutation__
 *
 * To run a mutation, you first call `useUpdateEnrollmentStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateEnrollmentStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateEnrollmentStatusMutation, { data, loading, error }] = useUpdateEnrollmentStatusMutation({
 *   variables: {
 *      enrollmentId: // value for 'enrollmentId'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useUpdateEnrollmentStatusMutation(baseOptions?: Apollo.MutationHookOptions<UpdateEnrollmentStatusMutation, UpdateEnrollmentStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateEnrollmentStatusMutation, UpdateEnrollmentStatusMutationVariables>(UpdateEnrollmentStatusDocument, options);
      }
export type UpdateEnrollmentStatusMutationHookResult = ReturnType<typeof useUpdateEnrollmentStatusMutation>;
export type UpdateEnrollmentStatusMutationResult = Apollo.MutationResult<UpdateEnrollmentStatusMutation>;
export type UpdateEnrollmentStatusMutationOptions = Apollo.BaseMutationOptions<UpdateEnrollmentStatusMutation, UpdateEnrollmentStatusMutationVariables>;
export const MessageTypesDocument = gql`
    query MessageTypes {
  messageTypes {
    id
    type_name
    description
    active
    created_at
    updated_at
  }
}
    `;

/**
 * __useMessageTypesQuery__
 *
 * To run a query within a React component, call `useMessageTypesQuery` and pass it any options that fit your needs.
 * When your component renders, `useMessageTypesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMessageTypesQuery({
 *   variables: {
 *   },
 * });
 */
export function useMessageTypesQuery(baseOptions?: Apollo.QueryHookOptions<MessageTypesQuery, MessageTypesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MessageTypesQuery, MessageTypesQueryVariables>(MessageTypesDocument, options);
      }
export function useMessageTypesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MessageTypesQuery, MessageTypesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MessageTypesQuery, MessageTypesQueryVariables>(MessageTypesDocument, options);
        }
// @ts-ignore
export function useMessageTypesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MessageTypesQuery, MessageTypesQueryVariables>): Apollo.UseSuspenseQueryResult<MessageTypesQuery, MessageTypesQueryVariables>;
export function useMessageTypesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MessageTypesQuery, MessageTypesQueryVariables>): Apollo.UseSuspenseQueryResult<MessageTypesQuery | undefined, MessageTypesQueryVariables>;
export function useMessageTypesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MessageTypesQuery, MessageTypesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MessageTypesQuery, MessageTypesQueryVariables>(MessageTypesDocument, options);
        }
export type MessageTypesQueryHookResult = ReturnType<typeof useMessageTypesQuery>;
export type MessageTypesLazyQueryHookResult = ReturnType<typeof useMessageTypesLazyQuery>;
export type MessageTypesSuspenseQueryHookResult = ReturnType<typeof useMessageTypesSuspenseQuery>;
export type MessageTypesQueryResult = Apollo.QueryResult<MessageTypesQuery, MessageTypesQueryVariables>;
export const MessagesReceivedDocument = gql`
    query MessagesReceived($userId: Int!) {
  messagesReceived(userId: $userId) {
    id
    message_id
    recipient_id
    read
    read_at
    deleted
    created_at
    message {
      id
      sender_id
      type_message_id
      subject
      content
      sent_at
      created_at
      sender {
        id
        first_name
        last_name
        email
      }
      messageType {
        id
        type_name
        description
      }
    }
  }
}
    `;

/**
 * __useMessagesReceivedQuery__
 *
 * To run a query within a React component, call `useMessagesReceivedQuery` and pass it any options that fit your needs.
 * When your component renders, `useMessagesReceivedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMessagesReceivedQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useMessagesReceivedQuery(baseOptions: Apollo.QueryHookOptions<MessagesReceivedQuery, MessagesReceivedQueryVariables> & ({ variables: MessagesReceivedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MessagesReceivedQuery, MessagesReceivedQueryVariables>(MessagesReceivedDocument, options);
      }
export function useMessagesReceivedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MessagesReceivedQuery, MessagesReceivedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MessagesReceivedQuery, MessagesReceivedQueryVariables>(MessagesReceivedDocument, options);
        }
// @ts-ignore
export function useMessagesReceivedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MessagesReceivedQuery, MessagesReceivedQueryVariables>): Apollo.UseSuspenseQueryResult<MessagesReceivedQuery, MessagesReceivedQueryVariables>;
export function useMessagesReceivedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MessagesReceivedQuery, MessagesReceivedQueryVariables>): Apollo.UseSuspenseQueryResult<MessagesReceivedQuery | undefined, MessagesReceivedQueryVariables>;
export function useMessagesReceivedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MessagesReceivedQuery, MessagesReceivedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MessagesReceivedQuery, MessagesReceivedQueryVariables>(MessagesReceivedDocument, options);
        }
export type MessagesReceivedQueryHookResult = ReturnType<typeof useMessagesReceivedQuery>;
export type MessagesReceivedLazyQueryHookResult = ReturnType<typeof useMessagesReceivedLazyQuery>;
export type MessagesReceivedSuspenseQueryHookResult = ReturnType<typeof useMessagesReceivedSuspenseQuery>;
export type MessagesReceivedQueryResult = Apollo.QueryResult<MessagesReceivedQuery, MessagesReceivedQueryVariables>;
export const MessagesTrashedDocument = gql`
    query MessagesTrashed($userId: Int!) {
  messagesTrashed(userId: $userId) {
    id
    message_id
    recipient_id
    read
    read_at
    deleted
    created_at
    message {
      id
      sender_id
      type_message_id
      subject
      content
      sent_at
      created_at
      sender {
        id
        first_name
        last_name
        email
      }
      messageType {
        id
        type_name
        description
      }
    }
  }
}
    `;

/**
 * __useMessagesTrashedQuery__
 *
 * To run a query within a React component, call `useMessagesTrashedQuery` and pass it any options that fit your needs.
 * When your component renders, `useMessagesTrashedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMessagesTrashedQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useMessagesTrashedQuery(baseOptions: Apollo.QueryHookOptions<MessagesTrashedQuery, MessagesTrashedQueryVariables> & ({ variables: MessagesTrashedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MessagesTrashedQuery, MessagesTrashedQueryVariables>(MessagesTrashedDocument, options);
      }
export function useMessagesTrashedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MessagesTrashedQuery, MessagesTrashedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MessagesTrashedQuery, MessagesTrashedQueryVariables>(MessagesTrashedDocument, options);
        }
// @ts-ignore
export function useMessagesTrashedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MessagesTrashedQuery, MessagesTrashedQueryVariables>): Apollo.UseSuspenseQueryResult<MessagesTrashedQuery, MessagesTrashedQueryVariables>;
export function useMessagesTrashedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MessagesTrashedQuery, MessagesTrashedQueryVariables>): Apollo.UseSuspenseQueryResult<MessagesTrashedQuery | undefined, MessagesTrashedQueryVariables>;
export function useMessagesTrashedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MessagesTrashedQuery, MessagesTrashedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MessagesTrashedQuery, MessagesTrashedQueryVariables>(MessagesTrashedDocument, options);
        }
export type MessagesTrashedQueryHookResult = ReturnType<typeof useMessagesTrashedQuery>;
export type MessagesTrashedLazyQueryHookResult = ReturnType<typeof useMessagesTrashedLazyQuery>;
export type MessagesTrashedSuspenseQueryHookResult = ReturnType<typeof useMessagesTrashedSuspenseQuery>;
export type MessagesTrashedQueryResult = Apollo.QueryResult<MessagesTrashedQuery, MessagesTrashedQueryVariables>;
export const UnreadMessagesCountDocument = gql`
    query UnreadMessagesCount($userId: Int!) {
  unreadMessagesCount(userId: $userId) {
    count
  }
}
    `;

/**
 * __useUnreadMessagesCountQuery__
 *
 * To run a query within a React component, call `useUnreadMessagesCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useUnreadMessagesCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUnreadMessagesCountQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useUnreadMessagesCountQuery(baseOptions: Apollo.QueryHookOptions<UnreadMessagesCountQuery, UnreadMessagesCountQueryVariables> & ({ variables: UnreadMessagesCountQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UnreadMessagesCountQuery, UnreadMessagesCountQueryVariables>(UnreadMessagesCountDocument, options);
      }
export function useUnreadMessagesCountLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UnreadMessagesCountQuery, UnreadMessagesCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UnreadMessagesCountQuery, UnreadMessagesCountQueryVariables>(UnreadMessagesCountDocument, options);
        }
// @ts-ignore
export function useUnreadMessagesCountSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<UnreadMessagesCountQuery, UnreadMessagesCountQueryVariables>): Apollo.UseSuspenseQueryResult<UnreadMessagesCountQuery, UnreadMessagesCountQueryVariables>;
export function useUnreadMessagesCountSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<UnreadMessagesCountQuery, UnreadMessagesCountQueryVariables>): Apollo.UseSuspenseQueryResult<UnreadMessagesCountQuery | undefined, UnreadMessagesCountQueryVariables>;
export function useUnreadMessagesCountSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<UnreadMessagesCountQuery, UnreadMessagesCountQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<UnreadMessagesCountQuery, UnreadMessagesCountQueryVariables>(UnreadMessagesCountDocument, options);
        }
export type UnreadMessagesCountQueryHookResult = ReturnType<typeof useUnreadMessagesCountQuery>;
export type UnreadMessagesCountLazyQueryHookResult = ReturnType<typeof useUnreadMessagesCountLazyQuery>;
export type UnreadMessagesCountSuspenseQueryHookResult = ReturnType<typeof useUnreadMessagesCountSuspenseQuery>;
export type UnreadMessagesCountQueryResult = Apollo.QueryResult<UnreadMessagesCountQuery, UnreadMessagesCountQueryVariables>;
export const CreateMessageTypeDocument = gql`
    mutation CreateMessageType($input: CreateMessageTypeInput!) {
  createMessageType(input: $input) {
    id
    type_name
    description
    active
    created_at
    updated_at
  }
}
    `;
export type CreateMessageTypeMutationFn = Apollo.MutationFunction<CreateMessageTypeMutation, CreateMessageTypeMutationVariables>;

/**
 * __useCreateMessageTypeMutation__
 *
 * To run a mutation, you first call `useCreateMessageTypeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateMessageTypeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createMessageTypeMutation, { data, loading, error }] = useCreateMessageTypeMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateMessageTypeMutation(baseOptions?: Apollo.MutationHookOptions<CreateMessageTypeMutation, CreateMessageTypeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateMessageTypeMutation, CreateMessageTypeMutationVariables>(CreateMessageTypeDocument, options);
      }
export type CreateMessageTypeMutationHookResult = ReturnType<typeof useCreateMessageTypeMutation>;
export type CreateMessageTypeMutationResult = Apollo.MutationResult<CreateMessageTypeMutation>;
export type CreateMessageTypeMutationOptions = Apollo.BaseMutationOptions<CreateMessageTypeMutation, CreateMessageTypeMutationVariables>;
export const UpdateMessageTypeDocument = gql`
    mutation UpdateMessageType($id: Int!, $input: UpdateMessageTypeInput!) {
  updateMessageType(id: $id, input: $input) {
    id
    type_name
    description
    active
    created_at
    updated_at
  }
}
    `;
export type UpdateMessageTypeMutationFn = Apollo.MutationFunction<UpdateMessageTypeMutation, UpdateMessageTypeMutationVariables>;

/**
 * __useUpdateMessageTypeMutation__
 *
 * To run a mutation, you first call `useUpdateMessageTypeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateMessageTypeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateMessageTypeMutation, { data, loading, error }] = useUpdateMessageTypeMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateMessageTypeMutation(baseOptions?: Apollo.MutationHookOptions<UpdateMessageTypeMutation, UpdateMessageTypeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateMessageTypeMutation, UpdateMessageTypeMutationVariables>(UpdateMessageTypeDocument, options);
      }
export type UpdateMessageTypeMutationHookResult = ReturnType<typeof useUpdateMessageTypeMutation>;
export type UpdateMessageTypeMutationResult = Apollo.MutationResult<UpdateMessageTypeMutation>;
export type UpdateMessageTypeMutationOptions = Apollo.BaseMutationOptions<UpdateMessageTypeMutation, UpdateMessageTypeMutationVariables>;
export const DeleteMessageTypeDocument = gql`
    mutation DeleteMessageType($id: Int!) {
  deleteMessageType(id: $id) {
    success
    message
  }
}
    `;
export type DeleteMessageTypeMutationFn = Apollo.MutationFunction<DeleteMessageTypeMutation, DeleteMessageTypeMutationVariables>;

/**
 * __useDeleteMessageTypeMutation__
 *
 * To run a mutation, you first call `useDeleteMessageTypeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteMessageTypeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteMessageTypeMutation, { data, loading, error }] = useDeleteMessageTypeMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteMessageTypeMutation(baseOptions?: Apollo.MutationHookOptions<DeleteMessageTypeMutation, DeleteMessageTypeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteMessageTypeMutation, DeleteMessageTypeMutationVariables>(DeleteMessageTypeDocument, options);
      }
export type DeleteMessageTypeMutationHookResult = ReturnType<typeof useDeleteMessageTypeMutation>;
export type DeleteMessageTypeMutationResult = Apollo.MutationResult<DeleteMessageTypeMutation>;
export type DeleteMessageTypeMutationOptions = Apollo.BaseMutationOptions<DeleteMessageTypeMutation, DeleteMessageTypeMutationVariables>;
export const SendMessageDocument = gql`
    mutation SendMessage($input: SendMessageInput!) {
  sendMessage(input: $input) {
    id
    sender_id
    type_message_id
    subject
    content
    sent_at
    created_at
    sender {
      id
      first_name
      last_name
      email
    }
  }
}
    `;
export type SendMessageMutationFn = Apollo.MutationFunction<SendMessageMutation, SendMessageMutationVariables>;

/**
 * __useSendMessageMutation__
 *
 * To run a mutation, you first call `useSendMessageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendMessageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendMessageMutation, { data, loading, error }] = useSendMessageMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSendMessageMutation(baseOptions?: Apollo.MutationHookOptions<SendMessageMutation, SendMessageMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SendMessageMutation, SendMessageMutationVariables>(SendMessageDocument, options);
      }
export type SendMessageMutationHookResult = ReturnType<typeof useSendMessageMutation>;
export type SendMessageMutationResult = Apollo.MutationResult<SendMessageMutation>;
export type SendMessageMutationOptions = Apollo.BaseMutationOptions<SendMessageMutation, SendMessageMutationVariables>;
export const MarkMessageAsReadDocument = gql`
    mutation MarkMessageAsRead($recipientId: Int!) {
  markMessageAsRead(recipientId: $recipientId) {
    id
    message_id
    recipient_id
    read
    read_at
    deleted
    created_at
  }
}
    `;
export type MarkMessageAsReadMutationFn = Apollo.MutationFunction<MarkMessageAsReadMutation, MarkMessageAsReadMutationVariables>;

/**
 * __useMarkMessageAsReadMutation__
 *
 * To run a mutation, you first call `useMarkMessageAsReadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMarkMessageAsReadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [markMessageAsReadMutation, { data, loading, error }] = useMarkMessageAsReadMutation({
 *   variables: {
 *      recipientId: // value for 'recipientId'
 *   },
 * });
 */
export function useMarkMessageAsReadMutation(baseOptions?: Apollo.MutationHookOptions<MarkMessageAsReadMutation, MarkMessageAsReadMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<MarkMessageAsReadMutation, MarkMessageAsReadMutationVariables>(MarkMessageAsReadDocument, options);
      }
export type MarkMessageAsReadMutationHookResult = ReturnType<typeof useMarkMessageAsReadMutation>;
export type MarkMessageAsReadMutationResult = Apollo.MutationResult<MarkMessageAsReadMutation>;
export type MarkMessageAsReadMutationOptions = Apollo.BaseMutationOptions<MarkMessageAsReadMutation, MarkMessageAsReadMutationVariables>;
export const DeleteReceivedMessageDocument = gql`
    mutation DeleteReceivedMessage($recipientId: Int!) {
  deleteReceivedMessage(recipientId: $recipientId) {
    success
    message
  }
}
    `;
export type DeleteReceivedMessageMutationFn = Apollo.MutationFunction<DeleteReceivedMessageMutation, DeleteReceivedMessageMutationVariables>;

/**
 * __useDeleteReceivedMessageMutation__
 *
 * To run a mutation, you first call `useDeleteReceivedMessageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteReceivedMessageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteReceivedMessageMutation, { data, loading, error }] = useDeleteReceivedMessageMutation({
 *   variables: {
 *      recipientId: // value for 'recipientId'
 *   },
 * });
 */
export function useDeleteReceivedMessageMutation(baseOptions?: Apollo.MutationHookOptions<DeleteReceivedMessageMutation, DeleteReceivedMessageMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteReceivedMessageMutation, DeleteReceivedMessageMutationVariables>(DeleteReceivedMessageDocument, options);
      }
export type DeleteReceivedMessageMutationHookResult = ReturnType<typeof useDeleteReceivedMessageMutation>;
export type DeleteReceivedMessageMutationResult = Apollo.MutationResult<DeleteReceivedMessageMutation>;
export type DeleteReceivedMessageMutationOptions = Apollo.BaseMutationOptions<DeleteReceivedMessageMutation, DeleteReceivedMessageMutationVariables>;
export const RestoreMessageDocument = gql`
    mutation RestoreMessage($recipientId: Int!) {
  restoreMessage(recipientId: $recipientId) {
    id
    message_id
    recipient_id
    read
    read_at
    deleted
    created_at
  }
}
    `;
export type RestoreMessageMutationFn = Apollo.MutationFunction<RestoreMessageMutation, RestoreMessageMutationVariables>;

/**
 * __useRestoreMessageMutation__
 *
 * To run a mutation, you first call `useRestoreMessageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRestoreMessageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [restoreMessageMutation, { data, loading, error }] = useRestoreMessageMutation({
 *   variables: {
 *      recipientId: // value for 'recipientId'
 *   },
 * });
 */
export function useRestoreMessageMutation(baseOptions?: Apollo.MutationHookOptions<RestoreMessageMutation, RestoreMessageMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RestoreMessageMutation, RestoreMessageMutationVariables>(RestoreMessageDocument, options);
      }
export type RestoreMessageMutationHookResult = ReturnType<typeof useRestoreMessageMutation>;
export type RestoreMessageMutationResult = Apollo.MutationResult<RestoreMessageMutation>;
export type RestoreMessageMutationOptions = Apollo.BaseMutationOptions<RestoreMessageMutation, RestoreMessageMutationVariables>;
export const NotificationsDocument = gql`
    query Notifications($userId: Int!) {
  notifications(userId: $userId) {
    id
    user_id
    title
    message
    type
    read
    read_at
    created_at
    user {
      id
      first_name
      last_name
      email
    }
  }
}
    `;

/**
 * __useNotificationsQuery__
 *
 * To run a query within a React component, call `useNotificationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useNotificationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNotificationsQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useNotificationsQuery(baseOptions: Apollo.QueryHookOptions<NotificationsQuery, NotificationsQueryVariables> & ({ variables: NotificationsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<NotificationsQuery, NotificationsQueryVariables>(NotificationsDocument, options);
      }
export function useNotificationsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<NotificationsQuery, NotificationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<NotificationsQuery, NotificationsQueryVariables>(NotificationsDocument, options);
        }
// @ts-ignore
export function useNotificationsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<NotificationsQuery, NotificationsQueryVariables>): Apollo.UseSuspenseQueryResult<NotificationsQuery, NotificationsQueryVariables>;
export function useNotificationsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<NotificationsQuery, NotificationsQueryVariables>): Apollo.UseSuspenseQueryResult<NotificationsQuery | undefined, NotificationsQueryVariables>;
export function useNotificationsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<NotificationsQuery, NotificationsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<NotificationsQuery, NotificationsQueryVariables>(NotificationsDocument, options);
        }
export type NotificationsQueryHookResult = ReturnType<typeof useNotificationsQuery>;
export type NotificationsLazyQueryHookResult = ReturnType<typeof useNotificationsLazyQuery>;
export type NotificationsSuspenseQueryHookResult = ReturnType<typeof useNotificationsSuspenseQuery>;
export type NotificationsQueryResult = Apollo.QueryResult<NotificationsQuery, NotificationsQueryVariables>;
export const CreateNotificationDocument = gql`
    mutation CreateNotification($input: CreateNotificationInput!) {
  createNotification(input: $input) {
    id
    user_id
    title
    message
    type
    read
    read_at
    created_at
  }
}
    `;
export type CreateNotificationMutationFn = Apollo.MutationFunction<CreateNotificationMutation, CreateNotificationMutationVariables>;

/**
 * __useCreateNotificationMutation__
 *
 * To run a mutation, you first call `useCreateNotificationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateNotificationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createNotificationMutation, { data, loading, error }] = useCreateNotificationMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateNotificationMutation(baseOptions?: Apollo.MutationHookOptions<CreateNotificationMutation, CreateNotificationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateNotificationMutation, CreateNotificationMutationVariables>(CreateNotificationDocument, options);
      }
export type CreateNotificationMutationHookResult = ReturnType<typeof useCreateNotificationMutation>;
export type CreateNotificationMutationResult = Apollo.MutationResult<CreateNotificationMutation>;
export type CreateNotificationMutationOptions = Apollo.BaseMutationOptions<CreateNotificationMutation, CreateNotificationMutationVariables>;
export const MarkNotificationAsReadDocument = gql`
    mutation MarkNotificationAsRead($notificationId: Int!) {
  markNotificationAsRead(notificationId: $notificationId) {
    id
    user_id
    title
    message
    type
    read
    read_at
    created_at
  }
}
    `;
export type MarkNotificationAsReadMutationFn = Apollo.MutationFunction<MarkNotificationAsReadMutation, MarkNotificationAsReadMutationVariables>;

/**
 * __useMarkNotificationAsReadMutation__
 *
 * To run a mutation, you first call `useMarkNotificationAsReadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMarkNotificationAsReadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [markNotificationAsReadMutation, { data, loading, error }] = useMarkNotificationAsReadMutation({
 *   variables: {
 *      notificationId: // value for 'notificationId'
 *   },
 * });
 */
export function useMarkNotificationAsReadMutation(baseOptions?: Apollo.MutationHookOptions<MarkNotificationAsReadMutation, MarkNotificationAsReadMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<MarkNotificationAsReadMutation, MarkNotificationAsReadMutationVariables>(MarkNotificationAsReadDocument, options);
      }
export type MarkNotificationAsReadMutationHookResult = ReturnType<typeof useMarkNotificationAsReadMutation>;
export type MarkNotificationAsReadMutationResult = Apollo.MutationResult<MarkNotificationAsReadMutation>;
export type MarkNotificationAsReadMutationOptions = Apollo.BaseMutationOptions<MarkNotificationAsReadMutation, MarkNotificationAsReadMutationVariables>;
export const GetProductsDocument = gql`
    query GetProducts($take: Int, $skip: Int) {
  products(take: $take, skip: $skip) {
    id
    name
    description
    price
    category_id
    image_url
    active
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetProductsQuery__
 *
 * To run a query within a React component, call `useGetProductsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProductsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProductsQuery({
 *   variables: {
 *      take: // value for 'take'
 *      skip: // value for 'skip'
 *   },
 * });
 */
export function useGetProductsQuery(baseOptions?: Apollo.QueryHookOptions<GetProductsQuery, GetProductsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetProductsQuery, GetProductsQueryVariables>(GetProductsDocument, options);
      }
export function useGetProductsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetProductsQuery, GetProductsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetProductsQuery, GetProductsQueryVariables>(GetProductsDocument, options);
        }
// @ts-ignore
export function useGetProductsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetProductsQuery, GetProductsQueryVariables>): Apollo.UseSuspenseQueryResult<GetProductsQuery, GetProductsQueryVariables>;
export function useGetProductsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetProductsQuery, GetProductsQueryVariables>): Apollo.UseSuspenseQueryResult<GetProductsQuery | undefined, GetProductsQueryVariables>;
export function useGetProductsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetProductsQuery, GetProductsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetProductsQuery, GetProductsQueryVariables>(GetProductsDocument, options);
        }
export type GetProductsQueryHookResult = ReturnType<typeof useGetProductsQuery>;
export type GetProductsLazyQueryHookResult = ReturnType<typeof useGetProductsLazyQuery>;
export type GetProductsSuspenseQueryHookResult = ReturnType<typeof useGetProductsSuspenseQuery>;
export type GetProductsQueryResult = Apollo.QueryResult<GetProductsQuery, GetProductsQueryVariables>;
export const GetProductDocument = gql`
    query GetProduct($id: Int!) {
  product(id: $id) {
    id
    name
    description
    price
    category_id
    image_url
    active
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetProductQuery__
 *
 * To run a query within a React component, call `useGetProductQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProductQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProductQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetProductQuery(baseOptions: Apollo.QueryHookOptions<GetProductQuery, GetProductQueryVariables> & ({ variables: GetProductQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetProductQuery, GetProductQueryVariables>(GetProductDocument, options);
      }
export function useGetProductLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetProductQuery, GetProductQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetProductQuery, GetProductQueryVariables>(GetProductDocument, options);
        }
// @ts-ignore
export function useGetProductSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetProductQuery, GetProductQueryVariables>): Apollo.UseSuspenseQueryResult<GetProductQuery, GetProductQueryVariables>;
export function useGetProductSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetProductQuery, GetProductQueryVariables>): Apollo.UseSuspenseQueryResult<GetProductQuery | undefined, GetProductQueryVariables>;
export function useGetProductSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetProductQuery, GetProductQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetProductQuery, GetProductQueryVariables>(GetProductDocument, options);
        }
export type GetProductQueryHookResult = ReturnType<typeof useGetProductQuery>;
export type GetProductLazyQueryHookResult = ReturnType<typeof useGetProductLazyQuery>;
export type GetProductSuspenseQueryHookResult = ReturnType<typeof useGetProductSuspenseQuery>;
export type GetProductQueryResult = Apollo.QueryResult<GetProductQuery, GetProductQueryVariables>;
export const GetProductCategoriesDocument = gql`
    query GetProductCategories {
  productCategories {
    id
    name
    description
    active
  }
}
    `;

/**
 * __useGetProductCategoriesQuery__
 *
 * To run a query within a React component, call `useGetProductCategoriesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProductCategoriesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProductCategoriesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetProductCategoriesQuery(baseOptions?: Apollo.QueryHookOptions<GetProductCategoriesQuery, GetProductCategoriesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetProductCategoriesQuery, GetProductCategoriesQueryVariables>(GetProductCategoriesDocument, options);
      }
export function useGetProductCategoriesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetProductCategoriesQuery, GetProductCategoriesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetProductCategoriesQuery, GetProductCategoriesQueryVariables>(GetProductCategoriesDocument, options);
        }
// @ts-ignore
export function useGetProductCategoriesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetProductCategoriesQuery, GetProductCategoriesQueryVariables>): Apollo.UseSuspenseQueryResult<GetProductCategoriesQuery, GetProductCategoriesQueryVariables>;
export function useGetProductCategoriesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetProductCategoriesQuery, GetProductCategoriesQueryVariables>): Apollo.UseSuspenseQueryResult<GetProductCategoriesQuery | undefined, GetProductCategoriesQueryVariables>;
export function useGetProductCategoriesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetProductCategoriesQuery, GetProductCategoriesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetProductCategoriesQuery, GetProductCategoriesQueryVariables>(GetProductCategoriesDocument, options);
        }
export type GetProductCategoriesQueryHookResult = ReturnType<typeof useGetProductCategoriesQuery>;
export type GetProductCategoriesLazyQueryHookResult = ReturnType<typeof useGetProductCategoriesLazyQuery>;
export type GetProductCategoriesSuspenseQueryHookResult = ReturnType<typeof useGetProductCategoriesSuspenseQuery>;
export type GetProductCategoriesQueryResult = Apollo.QueryResult<GetProductCategoriesQuery, GetProductCategoriesQueryVariables>;
export const CreateProductDocument = gql`
    mutation CreateProduct($input: CreateProductInput!) {
  createProduct(input: $input) {
    id
    name
    description
    price
    category_id
    image_url
    active
    created_at
  }
}
    `;
export type CreateProductMutationFn = Apollo.MutationFunction<CreateProductMutation, CreateProductMutationVariables>;

/**
 * __useCreateProductMutation__
 *
 * To run a mutation, you first call `useCreateProductMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateProductMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createProductMutation, { data, loading, error }] = useCreateProductMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateProductMutation(baseOptions?: Apollo.MutationHookOptions<CreateProductMutation, CreateProductMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateProductMutation, CreateProductMutationVariables>(CreateProductDocument, options);
      }
export type CreateProductMutationHookResult = ReturnType<typeof useCreateProductMutation>;
export type CreateProductMutationResult = Apollo.MutationResult<CreateProductMutation>;
export type CreateProductMutationOptions = Apollo.BaseMutationOptions<CreateProductMutation, CreateProductMutationVariables>;
export const UpdateProductDocument = gql`
    mutation UpdateProduct($id: Int!, $input: UpdateProductInput!) {
  updateProduct(id: $id, input: $input) {
    id
    name
    description
    price
    category_id
    image_url
    active
    updated_at
  }
}
    `;
export type UpdateProductMutationFn = Apollo.MutationFunction<UpdateProductMutation, UpdateProductMutationVariables>;

/**
 * __useUpdateProductMutation__
 *
 * To run a mutation, you first call `useUpdateProductMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateProductMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateProductMutation, { data, loading, error }] = useUpdateProductMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateProductMutation(baseOptions?: Apollo.MutationHookOptions<UpdateProductMutation, UpdateProductMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateProductMutation, UpdateProductMutationVariables>(UpdateProductDocument, options);
      }
export type UpdateProductMutationHookResult = ReturnType<typeof useUpdateProductMutation>;
export type UpdateProductMutationResult = Apollo.MutationResult<UpdateProductMutation>;
export type UpdateProductMutationOptions = Apollo.BaseMutationOptions<UpdateProductMutation, UpdateProductMutationVariables>;
export const DeleteProductDocument = gql`
    mutation DeleteProduct($id: Int!) {
  deleteProduct(id: $id) {
    success
    message
  }
}
    `;
export type DeleteProductMutationFn = Apollo.MutationFunction<DeleteProductMutation, DeleteProductMutationVariables>;

/**
 * __useDeleteProductMutation__
 *
 * To run a mutation, you first call `useDeleteProductMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteProductMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteProductMutation, { data, loading, error }] = useDeleteProductMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteProductMutation(baseOptions?: Apollo.MutationHookOptions<DeleteProductMutation, DeleteProductMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteProductMutation, DeleteProductMutationVariables>(DeleteProductDocument, options);
      }
export type DeleteProductMutationHookResult = ReturnType<typeof useDeleteProductMutation>;
export type DeleteProductMutationResult = Apollo.MutationResult<DeleteProductMutation>;
export type DeleteProductMutationOptions = Apollo.BaseMutationOptions<DeleteProductMutation, DeleteProductMutationVariables>;
export const GetOrdersDocument = gql`
    query GetOrders($userId: Int, $take: Int, $skip: Int) {
  orders(userId: $userId, take: $take, skip: $skip) {
    id
    user_id
    total_amount
    status
    delivery_address
    notes
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetOrdersQuery__
 *
 * To run a query within a React component, call `useGetOrdersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetOrdersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetOrdersQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      take: // value for 'take'
 *      skip: // value for 'skip'
 *   },
 * });
 */
export function useGetOrdersQuery(baseOptions?: Apollo.QueryHookOptions<GetOrdersQuery, GetOrdersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetOrdersQuery, GetOrdersQueryVariables>(GetOrdersDocument, options);
      }
export function useGetOrdersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetOrdersQuery, GetOrdersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetOrdersQuery, GetOrdersQueryVariables>(GetOrdersDocument, options);
        }
// @ts-ignore
export function useGetOrdersSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetOrdersQuery, GetOrdersQueryVariables>): Apollo.UseSuspenseQueryResult<GetOrdersQuery, GetOrdersQueryVariables>;
export function useGetOrdersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetOrdersQuery, GetOrdersQueryVariables>): Apollo.UseSuspenseQueryResult<GetOrdersQuery | undefined, GetOrdersQueryVariables>;
export function useGetOrdersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetOrdersQuery, GetOrdersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetOrdersQuery, GetOrdersQueryVariables>(GetOrdersDocument, options);
        }
export type GetOrdersQueryHookResult = ReturnType<typeof useGetOrdersQuery>;
export type GetOrdersLazyQueryHookResult = ReturnType<typeof useGetOrdersLazyQuery>;
export type GetOrdersSuspenseQueryHookResult = ReturnType<typeof useGetOrdersSuspenseQuery>;
export type GetOrdersQueryResult = Apollo.QueryResult<GetOrdersQuery, GetOrdersQueryVariables>;
export const GetOrderDocument = gql`
    query GetOrder($id: Int!) {
  order(id: $id) {
    id
    user_id
    total_amount
    status
    delivery_address
    notes
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetOrderQuery__
 *
 * To run a query within a React component, call `useGetOrderQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetOrderQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetOrderQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetOrderQuery(baseOptions: Apollo.QueryHookOptions<GetOrderQuery, GetOrderQueryVariables> & ({ variables: GetOrderQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetOrderQuery, GetOrderQueryVariables>(GetOrderDocument, options);
      }
export function useGetOrderLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetOrderQuery, GetOrderQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetOrderQuery, GetOrderQueryVariables>(GetOrderDocument, options);
        }
// @ts-ignore
export function useGetOrderSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetOrderQuery, GetOrderQueryVariables>): Apollo.UseSuspenseQueryResult<GetOrderQuery, GetOrderQueryVariables>;
export function useGetOrderSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetOrderQuery, GetOrderQueryVariables>): Apollo.UseSuspenseQueryResult<GetOrderQuery | undefined, GetOrderQueryVariables>;
export function useGetOrderSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetOrderQuery, GetOrderQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetOrderQuery, GetOrderQueryVariables>(GetOrderDocument, options);
        }
export type GetOrderQueryHookResult = ReturnType<typeof useGetOrderQuery>;
export type GetOrderLazyQueryHookResult = ReturnType<typeof useGetOrderLazyQuery>;
export type GetOrderSuspenseQueryHookResult = ReturnType<typeof useGetOrderSuspenseQuery>;
export type GetOrderQueryResult = Apollo.QueryResult<GetOrderQuery, GetOrderQueryVariables>;
export const CreateOrderDocument = gql`
    mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    id
    user_id
    total_amount
    status
    delivery_address
    created_at
  }
}
    `;
export type CreateOrderMutationFn = Apollo.MutationFunction<CreateOrderMutation, CreateOrderMutationVariables>;

/**
 * __useCreateOrderMutation__
 *
 * To run a mutation, you first call `useCreateOrderMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateOrderMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createOrderMutation, { data, loading, error }] = useCreateOrderMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateOrderMutation(baseOptions?: Apollo.MutationHookOptions<CreateOrderMutation, CreateOrderMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateOrderMutation, CreateOrderMutationVariables>(CreateOrderDocument, options);
      }
export type CreateOrderMutationHookResult = ReturnType<typeof useCreateOrderMutation>;
export type CreateOrderMutationResult = Apollo.MutationResult<CreateOrderMutation>;
export type CreateOrderMutationOptions = Apollo.BaseMutationOptions<CreateOrderMutation, CreateOrderMutationVariables>;
export const UpdateOrderStatusDocument = gql`
    mutation UpdateOrderStatus($orderId: Int!, $status: String!) {
  updateOrderStatus(orderId: $orderId, status: $status) {
    id
    user_id
    total_amount
    status
    updated_at
  }
}
    `;
export type UpdateOrderStatusMutationFn = Apollo.MutationFunction<UpdateOrderStatusMutation, UpdateOrderStatusMutationVariables>;

/**
 * __useUpdateOrderStatusMutation__
 *
 * To run a mutation, you first call `useUpdateOrderStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateOrderStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateOrderStatusMutation, { data, loading, error }] = useUpdateOrderStatusMutation({
 *   variables: {
 *      orderId: // value for 'orderId'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useUpdateOrderStatusMutation(baseOptions?: Apollo.MutationHookOptions<UpdateOrderStatusMutation, UpdateOrderStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateOrderStatusMutation, UpdateOrderStatusMutationVariables>(UpdateOrderStatusDocument, options);
      }
export type UpdateOrderStatusMutationHookResult = ReturnType<typeof useUpdateOrderStatusMutation>;
export type UpdateOrderStatusMutationResult = Apollo.MutationResult<UpdateOrderStatusMutation>;
export type UpdateOrderStatusMutationOptions = Apollo.BaseMutationOptions<UpdateOrderStatusMutation, UpdateOrderStatusMutationVariables>;
export const GetPaymentsDocument = gql`
    query GetPayments($userId: Int, $take: Int, $skip: Int) {
  payments(userId: $userId, take: $take, skip: $skip) {
    id
    user_id
    order_id
    subscription_id
    amount
    payment_method
    status
    payment_date
    stripe_payment_intent_id
    created_at
  }
}
    `;

/**
 * __useGetPaymentsQuery__
 *
 * To run a query within a React component, call `useGetPaymentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPaymentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPaymentsQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      take: // value for 'take'
 *      skip: // value for 'skip'
 *   },
 * });
 */
export function useGetPaymentsQuery(baseOptions?: Apollo.QueryHookOptions<GetPaymentsQuery, GetPaymentsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPaymentsQuery, GetPaymentsQueryVariables>(GetPaymentsDocument, options);
      }
export function useGetPaymentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPaymentsQuery, GetPaymentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPaymentsQuery, GetPaymentsQueryVariables>(GetPaymentsDocument, options);
        }
// @ts-ignore
export function useGetPaymentsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetPaymentsQuery, GetPaymentsQueryVariables>): Apollo.UseSuspenseQueryResult<GetPaymentsQuery, GetPaymentsQueryVariables>;
export function useGetPaymentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPaymentsQuery, GetPaymentsQueryVariables>): Apollo.UseSuspenseQueryResult<GetPaymentsQuery | undefined, GetPaymentsQueryVariables>;
export function useGetPaymentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPaymentsQuery, GetPaymentsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetPaymentsQuery, GetPaymentsQueryVariables>(GetPaymentsDocument, options);
        }
export type GetPaymentsQueryHookResult = ReturnType<typeof useGetPaymentsQuery>;
export type GetPaymentsLazyQueryHookResult = ReturnType<typeof useGetPaymentsLazyQuery>;
export type GetPaymentsSuspenseQueryHookResult = ReturnType<typeof useGetPaymentsSuspenseQuery>;
export type GetPaymentsQueryResult = Apollo.QueryResult<GetPaymentsQuery, GetPaymentsQueryVariables>;
export const GetPaymentDocument = gql`
    query GetPayment($id: Int!) {
  payment(id: $id) {
    id
    user_id
    order_id
    subscription_id
    amount
    payment_method
    status
    payment_date
    stripe_payment_intent_id
    created_at
  }
}
    `;

/**
 * __useGetPaymentQuery__
 *
 * To run a query within a React component, call `useGetPaymentQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPaymentQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPaymentQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetPaymentQuery(baseOptions: Apollo.QueryHookOptions<GetPaymentQuery, GetPaymentQueryVariables> & ({ variables: GetPaymentQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPaymentQuery, GetPaymentQueryVariables>(GetPaymentDocument, options);
      }
export function useGetPaymentLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPaymentQuery, GetPaymentQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPaymentQuery, GetPaymentQueryVariables>(GetPaymentDocument, options);
        }
// @ts-ignore
export function useGetPaymentSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetPaymentQuery, GetPaymentQueryVariables>): Apollo.UseSuspenseQueryResult<GetPaymentQuery, GetPaymentQueryVariables>;
export function useGetPaymentSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPaymentQuery, GetPaymentQueryVariables>): Apollo.UseSuspenseQueryResult<GetPaymentQuery | undefined, GetPaymentQueryVariables>;
export function useGetPaymentSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPaymentQuery, GetPaymentQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetPaymentQuery, GetPaymentQueryVariables>(GetPaymentDocument, options);
        }
export type GetPaymentQueryHookResult = ReturnType<typeof useGetPaymentQuery>;
export type GetPaymentLazyQueryHookResult = ReturnType<typeof useGetPaymentLazyQuery>;
export type GetPaymentSuspenseQueryHookResult = ReturnType<typeof useGetPaymentSuspenseQuery>;
export type GetPaymentQueryResult = Apollo.QueryResult<GetPaymentQuery, GetPaymentQueryVariables>;
export const CreatePaymentDocument = gql`
    mutation CreatePayment($input: CreatePaymentInput!) {
  createPayment(input: $input) {
    id
    user_id
    order_id
    subscription_id
    amount
    payment_method
    status
    created_at
  }
}
    `;
export type CreatePaymentMutationFn = Apollo.MutationFunction<CreatePaymentMutation, CreatePaymentMutationVariables>;

/**
 * __useCreatePaymentMutation__
 *
 * To run a mutation, you first call `useCreatePaymentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreatePaymentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPaymentMutation, { data, loading, error }] = useCreatePaymentMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreatePaymentMutation(baseOptions?: Apollo.MutationHookOptions<CreatePaymentMutation, CreatePaymentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreatePaymentMutation, CreatePaymentMutationVariables>(CreatePaymentDocument, options);
      }
export type CreatePaymentMutationHookResult = ReturnType<typeof useCreatePaymentMutation>;
export type CreatePaymentMutationResult = Apollo.MutationResult<CreatePaymentMutation>;
export type CreatePaymentMutationOptions = Apollo.BaseMutationOptions<CreatePaymentMutation, CreatePaymentMutationVariables>;
export const ProcessPaymentDocument = gql`
    mutation ProcessPayment($paymentId: Int!) {
  processPayment(paymentId: $paymentId) {
    success
    message
    payment {
      id
      status
      payment_date
    }
    clientSecret
  }
}
    `;
export type ProcessPaymentMutationFn = Apollo.MutationFunction<ProcessPaymentMutation, ProcessPaymentMutationVariables>;

/**
 * __useProcessPaymentMutation__
 *
 * To run a mutation, you first call `useProcessPaymentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useProcessPaymentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [processPaymentMutation, { data, loading, error }] = useProcessPaymentMutation({
 *   variables: {
 *      paymentId: // value for 'paymentId'
 *   },
 * });
 */
export function useProcessPaymentMutation(baseOptions?: Apollo.MutationHookOptions<ProcessPaymentMutation, ProcessPaymentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ProcessPaymentMutation, ProcessPaymentMutationVariables>(ProcessPaymentDocument, options);
      }
export type ProcessPaymentMutationHookResult = ReturnType<typeof useProcessPaymentMutation>;
export type ProcessPaymentMutationResult = Apollo.MutationResult<ProcessPaymentMutation>;
export type ProcessPaymentMutationOptions = Apollo.BaseMutationOptions<ProcessPaymentMutation, ProcessPaymentMutationVariables>;
export const GetProductStocksDocument = gql`
    query GetProductStocks($productId: Int!) {
  productStocks(productId: $productId) {
    id
    product_id
    size_id
    quantity
    min_quantity
    updated_at
  }
}
    `;

/**
 * __useGetProductStocksQuery__
 *
 * To run a query within a React component, call `useGetProductStocksQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProductStocksQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProductStocksQuery({
 *   variables: {
 *      productId: // value for 'productId'
 *   },
 * });
 */
export function useGetProductStocksQuery(baseOptions: Apollo.QueryHookOptions<GetProductStocksQuery, GetProductStocksQueryVariables> & ({ variables: GetProductStocksQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetProductStocksQuery, GetProductStocksQueryVariables>(GetProductStocksDocument, options);
      }
export function useGetProductStocksLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetProductStocksQuery, GetProductStocksQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetProductStocksQuery, GetProductStocksQueryVariables>(GetProductStocksDocument, options);
        }
// @ts-ignore
export function useGetProductStocksSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetProductStocksQuery, GetProductStocksQueryVariables>): Apollo.UseSuspenseQueryResult<GetProductStocksQuery, GetProductStocksQueryVariables>;
export function useGetProductStocksSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetProductStocksQuery, GetProductStocksQueryVariables>): Apollo.UseSuspenseQueryResult<GetProductStocksQuery | undefined, GetProductStocksQueryVariables>;
export function useGetProductStocksSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetProductStocksQuery, GetProductStocksQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetProductStocksQuery, GetProductStocksQueryVariables>(GetProductStocksDocument, options);
        }
export type GetProductStocksQueryHookResult = ReturnType<typeof useGetProductStocksQuery>;
export type GetProductStocksLazyQueryHookResult = ReturnType<typeof useGetProductStocksLazyQuery>;
export type GetProductStocksSuspenseQueryHookResult = ReturnType<typeof useGetProductStocksSuspenseQuery>;
export type GetProductStocksQueryResult = Apollo.QueryResult<GetProductStocksQuery, GetProductStocksQueryVariables>;
export const GetStockSizesDocument = gql`
    query GetStockSizes {
  stockSizes {
    id
    name
    code
  }
}
    `;

/**
 * __useGetStockSizesQuery__
 *
 * To run a query within a React component, call `useGetStockSizesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetStockSizesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetStockSizesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetStockSizesQuery(baseOptions?: Apollo.QueryHookOptions<GetStockSizesQuery, GetStockSizesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetStockSizesQuery, GetStockSizesQueryVariables>(GetStockSizesDocument, options);
      }
export function useGetStockSizesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetStockSizesQuery, GetStockSizesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetStockSizesQuery, GetStockSizesQueryVariables>(GetStockSizesDocument, options);
        }
// @ts-ignore
export function useGetStockSizesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetStockSizesQuery, GetStockSizesQueryVariables>): Apollo.UseSuspenseQueryResult<GetStockSizesQuery, GetStockSizesQueryVariables>;
export function useGetStockSizesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetStockSizesQuery, GetStockSizesQueryVariables>): Apollo.UseSuspenseQueryResult<GetStockSizesQuery | undefined, GetStockSizesQueryVariables>;
export function useGetStockSizesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetStockSizesQuery, GetStockSizesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetStockSizesQuery, GetStockSizesQueryVariables>(GetStockSizesDocument, options);
        }
export type GetStockSizesQueryHookResult = ReturnType<typeof useGetStockSizesQuery>;
export type GetStockSizesLazyQueryHookResult = ReturnType<typeof useGetStockSizesLazyQuery>;
export type GetStockSizesSuspenseQueryHookResult = ReturnType<typeof useGetStockSizesSuspenseQuery>;
export type GetStockSizesQueryResult = Apollo.QueryResult<GetStockSizesQuery, GetStockSizesQueryVariables>;
export const AttendanceStatsDocument = gql`
    query AttendanceStats($userId: Int!) {
  attendanceStats(userId: $userId) {
    user_id
    total_presences
    current_month
    monthly_average
    last_session
  }
}
    `;

/**
 * __useAttendanceStatsQuery__
 *
 * To run a query within a React component, call `useAttendanceStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useAttendanceStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAttendanceStatsQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useAttendanceStatsQuery(baseOptions: Apollo.QueryHookOptions<AttendanceStatsQuery, AttendanceStatsQueryVariables> & ({ variables: AttendanceStatsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<AttendanceStatsQuery, AttendanceStatsQueryVariables>(AttendanceStatsDocument, options);
      }
export function useAttendanceStatsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<AttendanceStatsQuery, AttendanceStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<AttendanceStatsQuery, AttendanceStatsQueryVariables>(AttendanceStatsDocument, options);
        }
// @ts-ignore
export function useAttendanceStatsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<AttendanceStatsQuery, AttendanceStatsQueryVariables>): Apollo.UseSuspenseQueryResult<AttendanceStatsQuery, AttendanceStatsQueryVariables>;
export function useAttendanceStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AttendanceStatsQuery, AttendanceStatsQueryVariables>): Apollo.UseSuspenseQueryResult<AttendanceStatsQuery | undefined, AttendanceStatsQueryVariables>;
export function useAttendanceStatsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AttendanceStatsQuery, AttendanceStatsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<AttendanceStatsQuery, AttendanceStatsQueryVariables>(AttendanceStatsDocument, options);
        }
export type AttendanceStatsQueryHookResult = ReturnType<typeof useAttendanceStatsQuery>;
export type AttendanceStatsLazyQueryHookResult = ReturnType<typeof useAttendanceStatsLazyQuery>;
export type AttendanceStatsSuspenseQueryHookResult = ReturnType<typeof useAttendanceStatsSuspenseQuery>;
export type AttendanceStatsQueryResult = Apollo.QueryResult<AttendanceStatsQuery, AttendanceStatsQueryVariables>;
export const TopMembersDocument = gql`
    query TopMembers($limit: Int) {
  topMembers(limit: $limit) {
    user_id
    first_name
    last_name
    total_presences
    attendance_rate
  }
}
    `;

/**
 * __useTopMembersQuery__
 *
 * To run a query within a React component, call `useTopMembersQuery` and pass it any options that fit your needs.
 * When your component renders, `useTopMembersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTopMembersQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useTopMembersQuery(baseOptions?: Apollo.QueryHookOptions<TopMembersQuery, TopMembersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TopMembersQuery, TopMembersQueryVariables>(TopMembersDocument, options);
      }
export function useTopMembersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TopMembersQuery, TopMembersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TopMembersQuery, TopMembersQueryVariables>(TopMembersDocument, options);
        }
// @ts-ignore
export function useTopMembersSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<TopMembersQuery, TopMembersQueryVariables>): Apollo.UseSuspenseQueryResult<TopMembersQuery, TopMembersQueryVariables>;
export function useTopMembersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TopMembersQuery, TopMembersQueryVariables>): Apollo.UseSuspenseQueryResult<TopMembersQuery | undefined, TopMembersQueryVariables>;
export function useTopMembersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TopMembersQuery, TopMembersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<TopMembersQuery, TopMembersQueryVariables>(TopMembersDocument, options);
        }
export type TopMembersQueryHookResult = ReturnType<typeof useTopMembersQuery>;
export type TopMembersLazyQueryHookResult = ReturnType<typeof useTopMembersLazyQuery>;
export type TopMembersSuspenseQueryHookResult = ReturnType<typeof useTopMembersSuspenseQuery>;
export type TopMembersQueryResult = Apollo.QueryResult<TopMembersQuery, TopMembersQueryVariables>;
export const MembersCountDocument = gql`
    query MembersCount {
  membersCount {
    count
  }
}
    `;

/**
 * __useMembersCountQuery__
 *
 * To run a query within a React component, call `useMembersCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useMembersCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMembersCountQuery({
 *   variables: {
 *   },
 * });
 */
export function useMembersCountQuery(baseOptions?: Apollo.QueryHookOptions<MembersCountQuery, MembersCountQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MembersCountQuery, MembersCountQueryVariables>(MembersCountDocument, options);
      }
export function useMembersCountLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MembersCountQuery, MembersCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MembersCountQuery, MembersCountQueryVariables>(MembersCountDocument, options);
        }
// @ts-ignore
export function useMembersCountSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MembersCountQuery, MembersCountQueryVariables>): Apollo.UseSuspenseQueryResult<MembersCountQuery, MembersCountQueryVariables>;
export function useMembersCountSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MembersCountQuery, MembersCountQueryVariables>): Apollo.UseSuspenseQueryResult<MembersCountQuery | undefined, MembersCountQueryVariables>;
export function useMembersCountSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MembersCountQuery, MembersCountQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MembersCountQuery, MembersCountQueryVariables>(MembersCountDocument, options);
        }
export type MembersCountQueryHookResult = ReturnType<typeof useMembersCountQuery>;
export type MembersCountLazyQueryHookResult = ReturnType<typeof useMembersCountLazyQuery>;
export type MembersCountSuspenseQueryHookResult = ReturnType<typeof useMembersCountSuspenseQuery>;
export type MembersCountQueryResult = Apollo.QueryResult<MembersCountQuery, MembersCountQueryVariables>;
export const MembersByGradeDocument = gql`
    query MembersByGrade {
  membersByGrade {
    grade_name
    count
  }
}
    `;

/**
 * __useMembersByGradeQuery__
 *
 * To run a query within a React component, call `useMembersByGradeQuery` and pass it any options that fit your needs.
 * When your component renders, `useMembersByGradeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMembersByGradeQuery({
 *   variables: {
 *   },
 * });
 */
export function useMembersByGradeQuery(baseOptions?: Apollo.QueryHookOptions<MembersByGradeQuery, MembersByGradeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MembersByGradeQuery, MembersByGradeQueryVariables>(MembersByGradeDocument, options);
      }
export function useMembersByGradeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MembersByGradeQuery, MembersByGradeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MembersByGradeQuery, MembersByGradeQueryVariables>(MembersByGradeDocument, options);
        }
// @ts-ignore
export function useMembersByGradeSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MembersByGradeQuery, MembersByGradeQueryVariables>): Apollo.UseSuspenseQueryResult<MembersByGradeQuery, MembersByGradeQueryVariables>;
export function useMembersByGradeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MembersByGradeQuery, MembersByGradeQueryVariables>): Apollo.UseSuspenseQueryResult<MembersByGradeQuery | undefined, MembersByGradeQueryVariables>;
export function useMembersByGradeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MembersByGradeQuery, MembersByGradeQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MembersByGradeQuery, MembersByGradeQueryVariables>(MembersByGradeDocument, options);
        }
export type MembersByGradeQueryHookResult = ReturnType<typeof useMembersByGradeQuery>;
export type MembersByGradeLazyQueryHookResult = ReturnType<typeof useMembersByGradeLazyQuery>;
export type MembersByGradeSuspenseQueryHookResult = ReturnType<typeof useMembersByGradeSuspenseQuery>;
export type MembersByGradeQueryResult = Apollo.QueryResult<MembersByGradeQuery, MembersByGradeQueryVariables>;
export const MembersByGenderDocument = gql`
    query MembersByGender {
  membersByGender {
    gender_name
    count
  }
}
    `;

/**
 * __useMembersByGenderQuery__
 *
 * To run a query within a React component, call `useMembersByGenderQuery` and pass it any options that fit your needs.
 * When your component renders, `useMembersByGenderQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMembersByGenderQuery({
 *   variables: {
 *   },
 * });
 */
export function useMembersByGenderQuery(baseOptions?: Apollo.QueryHookOptions<MembersByGenderQuery, MembersByGenderQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MembersByGenderQuery, MembersByGenderQueryVariables>(MembersByGenderDocument, options);
      }
export function useMembersByGenderLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MembersByGenderQuery, MembersByGenderQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MembersByGenderQuery, MembersByGenderQueryVariables>(MembersByGenderDocument, options);
        }
// @ts-ignore
export function useMembersByGenderSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MembersByGenderQuery, MembersByGenderQueryVariables>): Apollo.UseSuspenseQueryResult<MembersByGenderQuery, MembersByGenderQueryVariables>;
export function useMembersByGenderSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MembersByGenderQuery, MembersByGenderQueryVariables>): Apollo.UseSuspenseQueryResult<MembersByGenderQuery | undefined, MembersByGenderQueryVariables>;
export function useMembersByGenderSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MembersByGenderQuery, MembersByGenderQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MembersByGenderQuery, MembersByGenderQueryVariables>(MembersByGenderDocument, options);
        }
export type MembersByGenderQueryHookResult = ReturnType<typeof useMembersByGenderQuery>;
export type MembersByGenderLazyQueryHookResult = ReturnType<typeof useMembersByGenderLazyQuery>;
export type MembersByGenderSuspenseQueryHookResult = ReturnType<typeof useMembersByGenderSuspenseQuery>;
export type MembersByGenderQueryResult = Apollo.QueryResult<MembersByGenderQuery, MembersByGenderQueryVariables>;
export const BirthdaysDocument = gql`
    query Birthdays {
  birthdays {
    user_id
    first_name
    last_name
    birth_date
    age
  }
}
    `;

/**
 * __useBirthdaysQuery__
 *
 * To run a query within a React component, call `useBirthdaysQuery` and pass it any options that fit your needs.
 * When your component renders, `useBirthdaysQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBirthdaysQuery({
 *   variables: {
 *   },
 * });
 */
export function useBirthdaysQuery(baseOptions?: Apollo.QueryHookOptions<BirthdaysQuery, BirthdaysQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<BirthdaysQuery, BirthdaysQueryVariables>(BirthdaysDocument, options);
      }
export function useBirthdaysLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<BirthdaysQuery, BirthdaysQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<BirthdaysQuery, BirthdaysQueryVariables>(BirthdaysDocument, options);
        }
// @ts-ignore
export function useBirthdaysSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<BirthdaysQuery, BirthdaysQueryVariables>): Apollo.UseSuspenseQueryResult<BirthdaysQuery, BirthdaysQueryVariables>;
export function useBirthdaysSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<BirthdaysQuery, BirthdaysQueryVariables>): Apollo.UseSuspenseQueryResult<BirthdaysQuery | undefined, BirthdaysQueryVariables>;
export function useBirthdaysSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<BirthdaysQuery, BirthdaysQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<BirthdaysQuery, BirthdaysQueryVariables>(BirthdaysDocument, options);
        }
export type BirthdaysQueryHookResult = ReturnType<typeof useBirthdaysQuery>;
export type BirthdaysLazyQueryHookResult = ReturnType<typeof useBirthdaysLazyQuery>;
export type BirthdaysSuspenseQueryHookResult = ReturnType<typeof useBirthdaysSuspenseQuery>;
export type BirthdaysQueryResult = Apollo.QueryResult<BirthdaysQuery, BirthdaysQueryVariables>;
export const NewMembersDocument = gql`
    query NewMembers($limit: Int) {
  newMembers(limit: $limit) {
    id
    first_name
    last_name
    email
    phone
    birth_date
    created_at
  }
}
    `;

/**
 * __useNewMembersQuery__
 *
 * To run a query within a React component, call `useNewMembersQuery` and pass it any options that fit your needs.
 * When your component renders, `useNewMembersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNewMembersQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useNewMembersQuery(baseOptions?: Apollo.QueryHookOptions<NewMembersQuery, NewMembersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<NewMembersQuery, NewMembersQueryVariables>(NewMembersDocument, options);
      }
export function useNewMembersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<NewMembersQuery, NewMembersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<NewMembersQuery, NewMembersQueryVariables>(NewMembersDocument, options);
        }
// @ts-ignore
export function useNewMembersSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<NewMembersQuery, NewMembersQueryVariables>): Apollo.UseSuspenseQueryResult<NewMembersQuery, NewMembersQueryVariables>;
export function useNewMembersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<NewMembersQuery, NewMembersQueryVariables>): Apollo.UseSuspenseQueryResult<NewMembersQuery | undefined, NewMembersQueryVariables>;
export function useNewMembersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<NewMembersQuery, NewMembersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<NewMembersQuery, NewMembersQueryVariables>(NewMembersDocument, options);
        }
export type NewMembersQueryHookResult = ReturnType<typeof useNewMembersQuery>;
export type NewMembersLazyQueryHookResult = ReturnType<typeof useNewMembersLazyQuery>;
export type NewMembersSuspenseQueryHookResult = ReturnType<typeof useNewMembersSuspenseQuery>;
export type NewMembersQueryResult = Apollo.QueryResult<NewMembersQuery, NewMembersQueryVariables>;
export const TopProductsDocument = gql`
    query TopProducts($limit: Int) {
  topProducts(limit: $limit) {
    product_id
    name
    quantity_sold
    total_revenue
  }
}
    `;

/**
 * __useTopProductsQuery__
 *
 * To run a query within a React component, call `useTopProductsQuery` and pass it any options that fit your needs.
 * When your component renders, `useTopProductsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTopProductsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useTopProductsQuery(baseOptions?: Apollo.QueryHookOptions<TopProductsQuery, TopProductsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TopProductsQuery, TopProductsQueryVariables>(TopProductsDocument, options);
      }
export function useTopProductsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TopProductsQuery, TopProductsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TopProductsQuery, TopProductsQueryVariables>(TopProductsDocument, options);
        }
// @ts-ignore
export function useTopProductsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<TopProductsQuery, TopProductsQueryVariables>): Apollo.UseSuspenseQueryResult<TopProductsQuery, TopProductsQueryVariables>;
export function useTopProductsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TopProductsQuery, TopProductsQueryVariables>): Apollo.UseSuspenseQueryResult<TopProductsQuery | undefined, TopProductsQueryVariables>;
export function useTopProductsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TopProductsQuery, TopProductsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<TopProductsQuery, TopProductsQueryVariables>(TopProductsDocument, options);
        }
export type TopProductsQueryHookResult = ReturnType<typeof useTopProductsQuery>;
export type TopProductsLazyQueryHookResult = ReturnType<typeof useTopProductsLazyQuery>;
export type TopProductsSuspenseQueryHookResult = ReturnType<typeof useTopProductsSuspenseQuery>;
export type TopProductsQueryResult = Apollo.QueryResult<TopProductsQuery, TopProductsQueryVariables>;
export const WeeklySessionsDocument = gql`
    query WeeklySessions {
  weeklySessions {
    total
    by_day
  }
}
    `;

/**
 * __useWeeklySessionsQuery__
 *
 * To run a query within a React component, call `useWeeklySessionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useWeeklySessionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useWeeklySessionsQuery({
 *   variables: {
 *   },
 * });
 */
export function useWeeklySessionsQuery(baseOptions?: Apollo.QueryHookOptions<WeeklySessionsQuery, WeeklySessionsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<WeeklySessionsQuery, WeeklySessionsQueryVariables>(WeeklySessionsDocument, options);
      }
export function useWeeklySessionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<WeeklySessionsQuery, WeeklySessionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<WeeklySessionsQuery, WeeklySessionsQueryVariables>(WeeklySessionsDocument, options);
        }
// @ts-ignore
export function useWeeklySessionsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<WeeklySessionsQuery, WeeklySessionsQueryVariables>): Apollo.UseSuspenseQueryResult<WeeklySessionsQuery, WeeklySessionsQueryVariables>;
export function useWeeklySessionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<WeeklySessionsQuery, WeeklySessionsQueryVariables>): Apollo.UseSuspenseQueryResult<WeeklySessionsQuery | undefined, WeeklySessionsQueryVariables>;
export function useWeeklySessionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<WeeklySessionsQuery, WeeklySessionsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<WeeklySessionsQuery, WeeklySessionsQueryVariables>(WeeklySessionsDocument, options);
        }
export type WeeklySessionsQueryHookResult = ReturnType<typeof useWeeklySessionsQuery>;
export type WeeklySessionsLazyQueryHookResult = ReturnType<typeof useWeeklySessionsLazyQuery>;
export type WeeklySessionsSuspenseQueryHookResult = ReturnType<typeof useWeeklySessionsSuspenseQuery>;
export type WeeklySessionsQueryResult = Apollo.QueryResult<WeeklySessionsQuery, WeeklySessionsQueryVariables>;
export const MonthlyPaymentsDocument = gql`
    query MonthlyPayments {
  monthlyPayments {
    total
    count
  }
}
    `;

/**
 * __useMonthlyPaymentsQuery__
 *
 * To run a query within a React component, call `useMonthlyPaymentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useMonthlyPaymentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMonthlyPaymentsQuery({
 *   variables: {
 *   },
 * });
 */
export function useMonthlyPaymentsQuery(baseOptions?: Apollo.QueryHookOptions<MonthlyPaymentsQuery, MonthlyPaymentsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MonthlyPaymentsQuery, MonthlyPaymentsQueryVariables>(MonthlyPaymentsDocument, options);
      }
export function useMonthlyPaymentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MonthlyPaymentsQuery, MonthlyPaymentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MonthlyPaymentsQuery, MonthlyPaymentsQueryVariables>(MonthlyPaymentsDocument, options);
        }
// @ts-ignore
export function useMonthlyPaymentsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MonthlyPaymentsQuery, MonthlyPaymentsQueryVariables>): Apollo.UseSuspenseQueryResult<MonthlyPaymentsQuery, MonthlyPaymentsQueryVariables>;
export function useMonthlyPaymentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MonthlyPaymentsQuery, MonthlyPaymentsQueryVariables>): Apollo.UseSuspenseQueryResult<MonthlyPaymentsQuery | undefined, MonthlyPaymentsQueryVariables>;
export function useMonthlyPaymentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MonthlyPaymentsQuery, MonthlyPaymentsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MonthlyPaymentsQuery, MonthlyPaymentsQueryVariables>(MonthlyPaymentsDocument, options);
        }
export type MonthlyPaymentsQueryHookResult = ReturnType<typeof useMonthlyPaymentsQuery>;
export type MonthlyPaymentsLazyQueryHookResult = ReturnType<typeof useMonthlyPaymentsLazyQuery>;
export type MonthlyPaymentsSuspenseQueryHookResult = ReturnType<typeof useMonthlyPaymentsSuspenseQuery>;
export type MonthlyPaymentsQueryResult = Apollo.QueryResult<MonthlyPaymentsQuery, MonthlyPaymentsQueryVariables>;
export const RecentPaymentsDocument = gql`
    query RecentPayments($limit: Int) {
  recentPayments(limit: $limit) {
    id
    user_id
    amount
    payment_date
    status
    user_first_name
    user_last_name
  }
}
    `;

/**
 * __useRecentPaymentsQuery__
 *
 * To run a query within a React component, call `useRecentPaymentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useRecentPaymentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRecentPaymentsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useRecentPaymentsQuery(baseOptions?: Apollo.QueryHookOptions<RecentPaymentsQuery, RecentPaymentsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<RecentPaymentsQuery, RecentPaymentsQueryVariables>(RecentPaymentsDocument, options);
      }
export function useRecentPaymentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<RecentPaymentsQuery, RecentPaymentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<RecentPaymentsQuery, RecentPaymentsQueryVariables>(RecentPaymentsDocument, options);
        }
// @ts-ignore
export function useRecentPaymentsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<RecentPaymentsQuery, RecentPaymentsQueryVariables>): Apollo.UseSuspenseQueryResult<RecentPaymentsQuery, RecentPaymentsQueryVariables>;
export function useRecentPaymentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<RecentPaymentsQuery, RecentPaymentsQueryVariables>): Apollo.UseSuspenseQueryResult<RecentPaymentsQuery | undefined, RecentPaymentsQueryVariables>;
export function useRecentPaymentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<RecentPaymentsQuery, RecentPaymentsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<RecentPaymentsQuery, RecentPaymentsQueryVariables>(RecentPaymentsDocument, options);
        }
export type RecentPaymentsQueryHookResult = ReturnType<typeof useRecentPaymentsQuery>;
export type RecentPaymentsLazyQueryHookResult = ReturnType<typeof useRecentPaymentsLazyQuery>;
export type RecentPaymentsSuspenseQueryHookResult = ReturnType<typeof useRecentPaymentsSuspenseQuery>;
export type RecentPaymentsQueryResult = Apollo.QueryResult<RecentPaymentsQuery, RecentPaymentsQueryVariables>;
export const PendingPaymentsDocument = gql`
    query PendingPayments {
  pendingPayments {
    id
    user_id
    amount
    payment_date
    status
    user_first_name
    user_last_name
  }
}
    `;

/**
 * __usePendingPaymentsQuery__
 *
 * To run a query within a React component, call `usePendingPaymentsQuery` and pass it any options that fit your needs.
 * When your component renders, `usePendingPaymentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePendingPaymentsQuery({
 *   variables: {
 *   },
 * });
 */
export function usePendingPaymentsQuery(baseOptions?: Apollo.QueryHookOptions<PendingPaymentsQuery, PendingPaymentsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PendingPaymentsQuery, PendingPaymentsQueryVariables>(PendingPaymentsDocument, options);
      }
export function usePendingPaymentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PendingPaymentsQuery, PendingPaymentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PendingPaymentsQuery, PendingPaymentsQueryVariables>(PendingPaymentsDocument, options);
        }
// @ts-ignore
export function usePendingPaymentsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<PendingPaymentsQuery, PendingPaymentsQueryVariables>): Apollo.UseSuspenseQueryResult<PendingPaymentsQuery, PendingPaymentsQueryVariables>;
export function usePendingPaymentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PendingPaymentsQuery, PendingPaymentsQueryVariables>): Apollo.UseSuspenseQueryResult<PendingPaymentsQuery | undefined, PendingPaymentsQueryVariables>;
export function usePendingPaymentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PendingPaymentsQuery, PendingPaymentsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<PendingPaymentsQuery, PendingPaymentsQueryVariables>(PendingPaymentsDocument, options);
        }
export type PendingPaymentsQueryHookResult = ReturnType<typeof usePendingPaymentsQuery>;
export type PendingPaymentsLazyQueryHookResult = ReturnType<typeof usePendingPaymentsLazyQuery>;
export type PendingPaymentsSuspenseQueryHookResult = ReturnType<typeof usePendingPaymentsSuspenseQuery>;
export type PendingPaymentsQueryResult = Apollo.QueryResult<PendingPaymentsQuery, PendingPaymentsQueryVariables>;
export const OverduePaymentsDocument = gql`
    query OverduePayments {
  overduePayments {
    id
    user_id
    amount
    payment_date
    status
    user_first_name
    user_last_name
  }
}
    `;

/**
 * __useOverduePaymentsQuery__
 *
 * To run a query within a React component, call `useOverduePaymentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useOverduePaymentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOverduePaymentsQuery({
 *   variables: {
 *   },
 * });
 */
export function useOverduePaymentsQuery(baseOptions?: Apollo.QueryHookOptions<OverduePaymentsQuery, OverduePaymentsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<OverduePaymentsQuery, OverduePaymentsQueryVariables>(OverduePaymentsDocument, options);
      }
export function useOverduePaymentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<OverduePaymentsQuery, OverduePaymentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<OverduePaymentsQuery, OverduePaymentsQueryVariables>(OverduePaymentsDocument, options);
        }
// @ts-ignore
export function useOverduePaymentsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<OverduePaymentsQuery, OverduePaymentsQueryVariables>): Apollo.UseSuspenseQueryResult<OverduePaymentsQuery, OverduePaymentsQueryVariables>;
export function useOverduePaymentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<OverduePaymentsQuery, OverduePaymentsQueryVariables>): Apollo.UseSuspenseQueryResult<OverduePaymentsQuery | undefined, OverduePaymentsQueryVariables>;
export function useOverduePaymentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<OverduePaymentsQuery, OverduePaymentsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<OverduePaymentsQuery, OverduePaymentsQueryVariables>(OverduePaymentsDocument, options);
        }
export type OverduePaymentsQueryHookResult = ReturnType<typeof useOverduePaymentsQuery>;
export type OverduePaymentsLazyQueryHookResult = ReturnType<typeof useOverduePaymentsLazyQuery>;
export type OverduePaymentsSuspenseQueryHookResult = ReturnType<typeof useOverduePaymentsSuspenseQuery>;
export type OverduePaymentsQueryResult = Apollo.QueryResult<OverduePaymentsQuery, OverduePaymentsQueryVariables>;
export const LastPaymentsDocument = gql`
    query LastPayments($limit: Int) {
  lastPayments(limit: $limit) {
    id
    user_id
    amount
    payment_date
    status
    user_first_name
    user_last_name
  }
}
    `;

/**
 * __useLastPaymentsQuery__
 *
 * To run a query within a React component, call `useLastPaymentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useLastPaymentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLastPaymentsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useLastPaymentsQuery(baseOptions?: Apollo.QueryHookOptions<LastPaymentsQuery, LastPaymentsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<LastPaymentsQuery, LastPaymentsQueryVariables>(LastPaymentsDocument, options);
      }
export function useLastPaymentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<LastPaymentsQuery, LastPaymentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<LastPaymentsQuery, LastPaymentsQueryVariables>(LastPaymentsDocument, options);
        }
// @ts-ignore
export function useLastPaymentsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<LastPaymentsQuery, LastPaymentsQueryVariables>): Apollo.UseSuspenseQueryResult<LastPaymentsQuery, LastPaymentsQueryVariables>;
export function useLastPaymentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<LastPaymentsQuery, LastPaymentsQueryVariables>): Apollo.UseSuspenseQueryResult<LastPaymentsQuery | undefined, LastPaymentsQueryVariables>;
export function useLastPaymentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<LastPaymentsQuery, LastPaymentsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<LastPaymentsQuery, LastPaymentsQueryVariables>(LastPaymentsDocument, options);
        }
export type LastPaymentsQueryHookResult = ReturnType<typeof useLastPaymentsQuery>;
export type LastPaymentsLazyQueryHookResult = ReturnType<typeof useLastPaymentsLazyQuery>;
export type LastPaymentsSuspenseQueryHookResult = ReturnType<typeof useLastPaymentsSuspenseQuery>;
export type LastPaymentsQueryResult = Apollo.QueryResult<LastPaymentsQuery, LastPaymentsQueryVariables>;
export const PaymentsByMonthDocument = gql`
    query PaymentsByMonth {
  paymentsByMonth {
    month
    total
    count
  }
}
    `;

/**
 * __usePaymentsByMonthQuery__
 *
 * To run a query within a React component, call `usePaymentsByMonthQuery` and pass it any options that fit your needs.
 * When your component renders, `usePaymentsByMonthQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePaymentsByMonthQuery({
 *   variables: {
 *   },
 * });
 */
export function usePaymentsByMonthQuery(baseOptions?: Apollo.QueryHookOptions<PaymentsByMonthQuery, PaymentsByMonthQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PaymentsByMonthQuery, PaymentsByMonthQueryVariables>(PaymentsByMonthDocument, options);
      }
export function usePaymentsByMonthLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PaymentsByMonthQuery, PaymentsByMonthQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PaymentsByMonthQuery, PaymentsByMonthQueryVariables>(PaymentsByMonthDocument, options);
        }
// @ts-ignore
export function usePaymentsByMonthSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<PaymentsByMonthQuery, PaymentsByMonthQueryVariables>): Apollo.UseSuspenseQueryResult<PaymentsByMonthQuery, PaymentsByMonthQueryVariables>;
export function usePaymentsByMonthSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PaymentsByMonthQuery, PaymentsByMonthQueryVariables>): Apollo.UseSuspenseQueryResult<PaymentsByMonthQuery | undefined, PaymentsByMonthQueryVariables>;
export function usePaymentsByMonthSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PaymentsByMonthQuery, PaymentsByMonthQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<PaymentsByMonthQuery, PaymentsByMonthQueryVariables>(PaymentsByMonthDocument, options);
        }
export type PaymentsByMonthQueryHookResult = ReturnType<typeof usePaymentsByMonthQuery>;
export type PaymentsByMonthLazyQueryHookResult = ReturnType<typeof usePaymentsByMonthLazyQuery>;
export type PaymentsByMonthSuspenseQueryHookResult = ReturnType<typeof usePaymentsByMonthSuspenseQuery>;
export type PaymentsByMonthQueryResult = Apollo.QueryResult<PaymentsByMonthQuery, PaymentsByMonthQueryVariables>;
export const ActivePlansDocument = gql`
    query ActivePlans {
  activePlans {
    plan_name
    count
  }
}
    `;

/**
 * __useActivePlansQuery__
 *
 * To run a query within a React component, call `useActivePlansQuery` and pass it any options that fit your needs.
 * When your component renders, `useActivePlansQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useActivePlansQuery({
 *   variables: {
 *   },
 * });
 */
export function useActivePlansQuery(baseOptions?: Apollo.QueryHookOptions<ActivePlansQuery, ActivePlansQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ActivePlansQuery, ActivePlansQueryVariables>(ActivePlansDocument, options);
      }
export function useActivePlansLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ActivePlansQuery, ActivePlansQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ActivePlansQuery, ActivePlansQueryVariables>(ActivePlansDocument, options);
        }
// @ts-ignore
export function useActivePlansSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ActivePlansQuery, ActivePlansQueryVariables>): Apollo.UseSuspenseQueryResult<ActivePlansQuery, ActivePlansQueryVariables>;
export function useActivePlansSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ActivePlansQuery, ActivePlansQueryVariables>): Apollo.UseSuspenseQueryResult<ActivePlansQuery | undefined, ActivePlansQueryVariables>;
export function useActivePlansSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ActivePlansQuery, ActivePlansQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ActivePlansQuery, ActivePlansQueryVariables>(ActivePlansDocument, options);
        }
export type ActivePlansQueryHookResult = ReturnType<typeof useActivePlansQuery>;
export type ActivePlansLazyQueryHookResult = ReturnType<typeof useActivePlansLazyQuery>;
export type ActivePlansSuspenseQueryHookResult = ReturnType<typeof useActivePlansSuspenseQuery>;
export type ActivePlansQueryResult = Apollo.QueryResult<ActivePlansQuery, ActivePlansQueryVariables>;
export const RenewalRateDocument = gql`
    query RenewalRate {
  renewalRate {
    rate
  }
}
    `;

/**
 * __useRenewalRateQuery__
 *
 * To run a query within a React component, call `useRenewalRateQuery` and pass it any options that fit your needs.
 * When your component renders, `useRenewalRateQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRenewalRateQuery({
 *   variables: {
 *   },
 * });
 */
export function useRenewalRateQuery(baseOptions?: Apollo.QueryHookOptions<RenewalRateQuery, RenewalRateQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<RenewalRateQuery, RenewalRateQueryVariables>(RenewalRateDocument, options);
      }
export function useRenewalRateLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<RenewalRateQuery, RenewalRateQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<RenewalRateQuery, RenewalRateQueryVariables>(RenewalRateDocument, options);
        }
// @ts-ignore
export function useRenewalRateSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<RenewalRateQuery, RenewalRateQueryVariables>): Apollo.UseSuspenseQueryResult<RenewalRateQuery, RenewalRateQueryVariables>;
export function useRenewalRateSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<RenewalRateQuery, RenewalRateQueryVariables>): Apollo.UseSuspenseQueryResult<RenewalRateQuery | undefined, RenewalRateQueryVariables>;
export function useRenewalRateSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<RenewalRateQuery, RenewalRateQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<RenewalRateQuery, RenewalRateQueryVariables>(RenewalRateDocument, options);
        }
export type RenewalRateQueryHookResult = ReturnType<typeof useRenewalRateQuery>;
export type RenewalRateLazyQueryHookResult = ReturnType<typeof useRenewalRateLazyQuery>;
export type RenewalRateSuspenseQueryHookResult = ReturnType<typeof useRenewalRateSuspenseQuery>;
export type RenewalRateQueryResult = Apollo.QueryResult<RenewalRateQuery, RenewalRateQueryVariables>;
export const MembersByPlanDocument = gql`
    query MembersByPlan {
  membersByPlan {
    plan_name
    count
  }
}
    `;

/**
 * __useMembersByPlanQuery__
 *
 * To run a query within a React component, call `useMembersByPlanQuery` and pass it any options that fit your needs.
 * When your component renders, `useMembersByPlanQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMembersByPlanQuery({
 *   variables: {
 *   },
 * });
 */
export function useMembersByPlanQuery(baseOptions?: Apollo.QueryHookOptions<MembersByPlanQuery, MembersByPlanQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MembersByPlanQuery, MembersByPlanQueryVariables>(MembersByPlanDocument, options);
      }
export function useMembersByPlanLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MembersByPlanQuery, MembersByPlanQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MembersByPlanQuery, MembersByPlanQueryVariables>(MembersByPlanDocument, options);
        }
// @ts-ignore
export function useMembersByPlanSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MembersByPlanQuery, MembersByPlanQueryVariables>): Apollo.UseSuspenseQueryResult<MembersByPlanQuery, MembersByPlanQueryVariables>;
export function useMembersByPlanSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MembersByPlanQuery, MembersByPlanQueryVariables>): Apollo.UseSuspenseQueryResult<MembersByPlanQuery | undefined, MembersByPlanQueryVariables>;
export function useMembersByPlanSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MembersByPlanQuery, MembersByPlanQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MembersByPlanQuery, MembersByPlanQueryVariables>(MembersByPlanDocument, options);
        }
export type MembersByPlanQueryHookResult = ReturnType<typeof useMembersByPlanQuery>;
export type MembersByPlanLazyQueryHookResult = ReturnType<typeof useMembersByPlanLazyQuery>;
export type MembersByPlanSuspenseQueryHookResult = ReturnType<typeof useMembersByPlanSuspenseQuery>;
export type MembersByPlanQueryResult = Apollo.QueryResult<MembersByPlanQuery, MembersByPlanQueryVariables>;
export const GetUsersDocument = gql`
    query GetUsers($take: Int, $skip: Int) {
  users(take: $take, skip: $skip) {
    id
    first_name
    last_name
    email
    phone
    birth_date
    address
    gender_id
    role
    active
    email_verified
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetUsersQuery__
 *
 * To run a query within a React component, call `useGetUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUsersQuery({
 *   variables: {
 *      take: // value for 'take'
 *      skip: // value for 'skip'
 *   },
 * });
 */
export function useGetUsersQuery(baseOptions?: Apollo.QueryHookOptions<GetUsersQuery, GetUsersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, options);
      }
export function useGetUsersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUsersQuery, GetUsersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, options);
        }
// @ts-ignore
export function useGetUsersSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetUsersQuery, GetUsersQueryVariables>): Apollo.UseSuspenseQueryResult<GetUsersQuery, GetUsersQueryVariables>;
export function useGetUsersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUsersQuery, GetUsersQueryVariables>): Apollo.UseSuspenseQueryResult<GetUsersQuery | undefined, GetUsersQueryVariables>;
export function useGetUsersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUsersQuery, GetUsersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, options);
        }
export type GetUsersQueryHookResult = ReturnType<typeof useGetUsersQuery>;
export type GetUsersLazyQueryHookResult = ReturnType<typeof useGetUsersLazyQuery>;
export type GetUsersSuspenseQueryHookResult = ReturnType<typeof useGetUsersSuspenseQuery>;
export type GetUsersQueryResult = Apollo.QueryResult<GetUsersQuery, GetUsersQueryVariables>;
export const GetUserDocument = gql`
    query GetUser($id: Int!) {
  user(id: $id) {
    id
    first_name
    last_name
    email
    phone
    birth_date
    address
    gender_id
    role
    active
    email_verified
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetUserQuery__
 *
 * To run a query within a React component, call `useGetUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetUserQuery(baseOptions: Apollo.QueryHookOptions<GetUserQuery, GetUserQueryVariables> & ({ variables: GetUserQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
      }
export function useGetUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
        }
// @ts-ignore
export function useGetUserSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetUserQuery, GetUserQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserQuery, GetUserQueryVariables>;
export function useGetUserSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserQuery, GetUserQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserQuery | undefined, GetUserQueryVariables>;
export function useGetUserSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
        }
export type GetUserQueryHookResult = ReturnType<typeof useGetUserQuery>;
export type GetUserLazyQueryHookResult = ReturnType<typeof useGetUserLazyQuery>;
export type GetUserSuspenseQueryHookResult = ReturnType<typeof useGetUserSuspenseQuery>;
export type GetUserQueryResult = Apollo.QueryResult<GetUserQuery, GetUserQueryVariables>;
export const CreateUserDocument = gql`
    mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    first_name
    last_name
    email
    phone
    role
    active
    created_at
  }
}
    `;
export type CreateUserMutationFn = Apollo.MutationFunction<CreateUserMutation, CreateUserMutationVariables>;

/**
 * __useCreateUserMutation__
 *
 * To run a mutation, you first call `useCreateUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createUserMutation, { data, loading, error }] = useCreateUserMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateUserMutation(baseOptions?: Apollo.MutationHookOptions<CreateUserMutation, CreateUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateUserMutation, CreateUserMutationVariables>(CreateUserDocument, options);
      }
export type CreateUserMutationHookResult = ReturnType<typeof useCreateUserMutation>;
export type CreateUserMutationResult = Apollo.MutationResult<CreateUserMutation>;
export type CreateUserMutationOptions = Apollo.BaseMutationOptions<CreateUserMutation, CreateUserMutationVariables>;
export const UpdateUserDocument = gql`
    mutation UpdateUser($id: Int!, $input: UpdateUserInput!) {
  updateUser(id: $id, input: $input) {
    id
    first_name
    last_name
    email
    phone
    birth_date
    address
    active
    updated_at
  }
}
    `;
export type UpdateUserMutationFn = Apollo.MutationFunction<UpdateUserMutation, UpdateUserMutationVariables>;

/**
 * __useUpdateUserMutation__
 *
 * To run a mutation, you first call `useUpdateUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateUserMutation, { data, loading, error }] = useUpdateUserMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateUserMutation(baseOptions?: Apollo.MutationHookOptions<UpdateUserMutation, UpdateUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateUserMutation, UpdateUserMutationVariables>(UpdateUserDocument, options);
      }
export type UpdateUserMutationHookResult = ReturnType<typeof useUpdateUserMutation>;
export type UpdateUserMutationResult = Apollo.MutationResult<UpdateUserMutation>;
export type UpdateUserMutationOptions = Apollo.BaseMutationOptions<UpdateUserMutation, UpdateUserMutationVariables>;
export const DeleteUserDocument = gql`
    mutation DeleteUser($id: Int!) {
  deleteUser(id: $id) {
    success
    message
  }
}
    `;
export type DeleteUserMutationFn = Apollo.MutationFunction<DeleteUserMutation, DeleteUserMutationVariables>;

/**
 * __useDeleteUserMutation__
 *
 * To run a mutation, you first call `useDeleteUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteUserMutation, { data, loading, error }] = useDeleteUserMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteUserMutation(baseOptions?: Apollo.MutationHookOptions<DeleteUserMutation, DeleteUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeleteUserMutation, DeleteUserMutationVariables>(DeleteUserDocument, options);
      }
export type DeleteUserMutationHookResult = ReturnType<typeof useDeleteUserMutation>;
export type DeleteUserMutationResult = Apollo.MutationResult<DeleteUserMutation>;
export type DeleteUserMutationOptions = Apollo.BaseMutationOptions<DeleteUserMutation, DeleteUserMutationVariables>;
export const GetSubscriptionsDocument = gql`
    query GetSubscriptions {
  subscriptions {
    id
    subscription_name
    price
    duration_months
    description
    active
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetSubscriptions__
 *
 * To run a query within a React component, call `useGetSubscriptions` and pass it any options that fit your needs.
 * When your component renders, `useGetSubscriptions` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSubscriptions({
 *   variables: {
 *   },
 * });
 */
export function useGetSubscriptions(baseOptions?: Apollo.QueryHookOptions<GetSubscriptionsQuery, GetSubscriptionsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSubscriptionsQuery, GetSubscriptionsQueryVariables>(GetSubscriptionsDocument, options);
      }
export function useGetSubscriptionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSubscriptionsQuery, GetSubscriptionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSubscriptionsQuery, GetSubscriptionsQueryVariables>(GetSubscriptionsDocument, options);
        }
// @ts-ignore
export function useGetSubscriptionsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetSubscriptionsQuery, GetSubscriptionsQueryVariables>): Apollo.UseSuspenseQueryResult<GetSubscriptionsQuery, GetSubscriptionsQueryVariables>;
export function useGetSubscriptionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSubscriptionsQuery, GetSubscriptionsQueryVariables>): Apollo.UseSuspenseQueryResult<GetSubscriptionsQuery | undefined, GetSubscriptionsQueryVariables>;
export function useGetSubscriptionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSubscriptionsQuery, GetSubscriptionsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetSubscriptionsQuery, GetSubscriptionsQueryVariables>(GetSubscriptionsDocument, options);
        }
export type GetSubscriptionsHookResult = ReturnType<typeof useGetSubscriptions>;
export type GetSubscriptionsLazyQueryHookResult = ReturnType<typeof useGetSubscriptionsLazyQuery>;
export type GetSubscriptionsSuspenseQueryHookResult = ReturnType<typeof useGetSubscriptionsSuspenseQuery>;
export type GetSubscriptionsQueryResult = Apollo.QueryResult<GetSubscriptionsQuery, GetSubscriptionsQueryVariables>;
export const GetSubscriptionDocument = gql`
    query GetSubscription($id: Int!) {
  subscription(id: $id) {
    id
    subscription_name
    price
    duration_months
    description
    active
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetSubscription__
 *
 * To run a query within a React component, call `useGetSubscription` and pass it any options that fit your needs.
 * When your component renders, `useGetSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSubscription({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetSubscription(baseOptions: Apollo.QueryHookOptions<GetSubscriptionQuery, GetSubscriptionQueryVariables> & ({ variables: GetSubscriptionQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSubscriptionQuery, GetSubscriptionQueryVariables>(GetSubscriptionDocument, options);
      }
export function useGetSubscriptionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSubscriptionQuery, GetSubscriptionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSubscriptionQuery, GetSubscriptionQueryVariables>(GetSubscriptionDocument, options);
        }
// @ts-ignore
export function useGetSubscriptionSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetSubscriptionQuery, GetSubscriptionQueryVariables>): Apollo.UseSuspenseQueryResult<GetSubscriptionQuery, GetSubscriptionQueryVariables>;
export function useGetSubscriptionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSubscriptionQuery, GetSubscriptionQueryVariables>): Apollo.UseSuspenseQueryResult<GetSubscriptionQuery | undefined, GetSubscriptionQueryVariables>;
export function useGetSubscriptionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetSubscriptionQuery, GetSubscriptionQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetSubscriptionQuery, GetSubscriptionQueryVariables>(GetSubscriptionDocument, options);
        }
export type GetSubscriptionHookResult = ReturnType<typeof useGetSubscription>;
export type GetSubscriptionLazyQueryHookResult = ReturnType<typeof useGetSubscriptionLazyQuery>;
export type GetSubscriptionSuspenseQueryHookResult = ReturnType<typeof useGetSubscriptionSuspenseQuery>;
export type GetSubscriptionQueryResult = Apollo.QueryResult<GetSubscriptionQuery, GetSubscriptionQueryVariables>;
export const GetGradesDocument = gql`
    query GetGrades {
  grades {
    id
    grade_name
    description
    level_order
    active
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetGradesQuery__
 *
 * To run a query within a React component, call `useGetGradesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetGradesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetGradesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetGradesQuery(baseOptions?: Apollo.QueryHookOptions<GetGradesQuery, GetGradesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetGradesQuery, GetGradesQueryVariables>(GetGradesDocument, options);
      }
export function useGetGradesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetGradesQuery, GetGradesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetGradesQuery, GetGradesQueryVariables>(GetGradesDocument, options);
        }
// @ts-ignore
export function useGetGradesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetGradesQuery, GetGradesQueryVariables>): Apollo.UseSuspenseQueryResult<GetGradesQuery, GetGradesQueryVariables>;
export function useGetGradesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetGradesQuery, GetGradesQueryVariables>): Apollo.UseSuspenseQueryResult<GetGradesQuery | undefined, GetGradesQueryVariables>;
export function useGetGradesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetGradesQuery, GetGradesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetGradesQuery, GetGradesQueryVariables>(GetGradesDocument, options);
        }
export type GetGradesQueryHookResult = ReturnType<typeof useGetGradesQuery>;
export type GetGradesLazyQueryHookResult = ReturnType<typeof useGetGradesLazyQuery>;
export type GetGradesSuspenseQueryHookResult = ReturnType<typeof useGetGradesSuspenseQuery>;
export type GetGradesQueryResult = Apollo.QueryResult<GetGradesQuery, GetGradesQueryVariables>;
export const GetGradeDocument = gql`
    query GetGrade($id: Int!) {
  grade(id: $id) {
    id
    grade_name
    description
    level_order
    active
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetGradeQuery__
 *
 * To run a query within a React component, call `useGetGradeQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetGradeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetGradeQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetGradeQuery(baseOptions: Apollo.QueryHookOptions<GetGradeQuery, GetGradeQueryVariables> & ({ variables: GetGradeQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetGradeQuery, GetGradeQueryVariables>(GetGradeDocument, options);
      }
export function useGetGradeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetGradeQuery, GetGradeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetGradeQuery, GetGradeQueryVariables>(GetGradeDocument, options);
        }
// @ts-ignore
export function useGetGradeSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetGradeQuery, GetGradeQueryVariables>): Apollo.UseSuspenseQueryResult<GetGradeQuery, GetGradeQueryVariables>;
export function useGetGradeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetGradeQuery, GetGradeQueryVariables>): Apollo.UseSuspenseQueryResult<GetGradeQuery | undefined, GetGradeQueryVariables>;
export function useGetGradeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetGradeQuery, GetGradeQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetGradeQuery, GetGradeQueryVariables>(GetGradeDocument, options);
        }
export type GetGradeQueryHookResult = ReturnType<typeof useGetGradeQuery>;
export type GetGradeLazyQueryHookResult = ReturnType<typeof useGetGradeLazyQuery>;
export type GetGradeSuspenseQueryHookResult = ReturnType<typeof useGetGradeSuspenseQuery>;
export type GetGradeQueryResult = Apollo.QueryResult<GetGradeQuery, GetGradeQueryVariables>;
export const GetStatusesDocument = gql`
    query GetStatuses {
  statuses {
    id
    status_name
    description
    active
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetStatusesQuery__
 *
 * To run a query within a React component, call `useGetStatusesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetStatusesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetStatusesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetStatusesQuery(baseOptions?: Apollo.QueryHookOptions<GetStatusesQuery, GetStatusesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetStatusesQuery, GetStatusesQueryVariables>(GetStatusesDocument, options);
      }
export function useGetStatusesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetStatusesQuery, GetStatusesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetStatusesQuery, GetStatusesQueryVariables>(GetStatusesDocument, options);
        }
// @ts-ignore
export function useGetStatusesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetStatusesQuery, GetStatusesQueryVariables>): Apollo.UseSuspenseQueryResult<GetStatusesQuery, GetStatusesQueryVariables>;
export function useGetStatusesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetStatusesQuery, GetStatusesQueryVariables>): Apollo.UseSuspenseQueryResult<GetStatusesQuery | undefined, GetStatusesQueryVariables>;
export function useGetStatusesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetStatusesQuery, GetStatusesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetStatusesQuery, GetStatusesQueryVariables>(GetStatusesDocument, options);
        }
export type GetStatusesQueryHookResult = ReturnType<typeof useGetStatusesQuery>;
export type GetStatusesLazyQueryHookResult = ReturnType<typeof useGetStatusesLazyQuery>;
export type GetStatusesSuspenseQueryHookResult = ReturnType<typeof useGetStatusesSuspenseQuery>;
export type GetStatusesQueryResult = Apollo.QueryResult<GetStatusesQuery, GetStatusesQueryVariables>;
export const GetStatusDocument = gql`
    query GetStatus($id: Int!) {
  status(id: $id) {
    id
    status_name
    description
    active
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetStatusQuery__
 *
 * To run a query within a React component, call `useGetStatusQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetStatusQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetStatusQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetStatusQuery(baseOptions: Apollo.QueryHookOptions<GetStatusQuery, GetStatusQueryVariables> & ({ variables: GetStatusQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetStatusQuery, GetStatusQueryVariables>(GetStatusDocument, options);
      }
export function useGetStatusLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetStatusQuery, GetStatusQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetStatusQuery, GetStatusQueryVariables>(GetStatusDocument, options);
        }
// @ts-ignore
export function useGetStatusSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetStatusQuery, GetStatusQueryVariables>): Apollo.UseSuspenseQueryResult<GetStatusQuery, GetStatusQueryVariables>;
export function useGetStatusSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetStatusQuery, GetStatusQueryVariables>): Apollo.UseSuspenseQueryResult<GetStatusQuery | undefined, GetStatusQueryVariables>;
export function useGetStatusSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetStatusQuery, GetStatusQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetStatusQuery, GetStatusQueryVariables>(GetStatusDocument, options);
        }
export type GetStatusQueryHookResult = ReturnType<typeof useGetStatusQuery>;
export type GetStatusLazyQueryHookResult = ReturnType<typeof useGetStatusLazyQuery>;
export type GetStatusSuspenseQueryHookResult = ReturnType<typeof useGetStatusSuspenseQuery>;
export type GetStatusQueryResult = Apollo.QueryResult<GetStatusQuery, GetStatusQueryVariables>;
export const GetGendersDocument = gql`
    query GetGenders {
  genders {
    id
    gender_name
    active
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetGendersQuery__
 *
 * To run a query within a React component, call `useGetGendersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetGendersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetGendersQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetGendersQuery(baseOptions?: Apollo.QueryHookOptions<GetGendersQuery, GetGendersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetGendersQuery, GetGendersQueryVariables>(GetGendersDocument, options);
      }
export function useGetGendersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetGendersQuery, GetGendersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetGendersQuery, GetGendersQueryVariables>(GetGendersDocument, options);
        }
// @ts-ignore
export function useGetGendersSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetGendersQuery, GetGendersQueryVariables>): Apollo.UseSuspenseQueryResult<GetGendersQuery, GetGendersQueryVariables>;
export function useGetGendersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetGendersQuery, GetGendersQueryVariables>): Apollo.UseSuspenseQueryResult<GetGendersQuery | undefined, GetGendersQueryVariables>;
export function useGetGendersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetGendersQuery, GetGendersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetGendersQuery, GetGendersQueryVariables>(GetGendersDocument, options);
        }
export type GetGendersQueryHookResult = ReturnType<typeof useGetGendersQuery>;
export type GetGendersLazyQueryHookResult = ReturnType<typeof useGetGendersLazyQuery>;
export type GetGendersSuspenseQueryHookResult = ReturnType<typeof useGetGendersSuspenseQuery>;
export type GetGendersQueryResult = Apollo.QueryResult<GetGendersQuery, GetGendersQueryVariables>;
export const GetGenderDocument = gql`
    query GetGender($id: Int!) {
  gender(id: $id) {
    id
    gender_name
    active
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetGenderQuery__
 *
 * To run a query within a React component, call `useGetGenderQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetGenderQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetGenderQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetGenderQuery(baseOptions: Apollo.QueryHookOptions<GetGenderQuery, GetGenderQueryVariables> & ({ variables: GetGenderQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetGenderQuery, GetGenderQueryVariables>(GetGenderDocument, options);
      }
export function useGetGenderLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetGenderQuery, GetGenderQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetGenderQuery, GetGenderQueryVariables>(GetGenderDocument, options);
        }
// @ts-ignore
export function useGetGenderSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetGenderQuery, GetGenderQueryVariables>): Apollo.UseSuspenseQueryResult<GetGenderQuery, GetGenderQueryVariables>;
export function useGetGenderSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetGenderQuery, GetGenderQueryVariables>): Apollo.UseSuspenseQueryResult<GetGenderQuery | undefined, GetGenderQueryVariables>;
export function useGetGenderSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetGenderQuery, GetGenderQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetGenderQuery, GetGenderQueryVariables>(GetGenderDocument, options);
        }
export type GetGenderQueryHookResult = ReturnType<typeof useGetGenderQuery>;
export type GetGenderLazyQueryHookResult = ReturnType<typeof useGetGenderLazyQuery>;
export type GetGenderSuspenseQueryHookResult = ReturnType<typeof useGetGenderSuspenseQuery>;
export type GetGenderQueryResult = Apollo.QueryResult<GetGenderQuery, GetGenderQueryVariables>;
export const GetUserSubscriptionDocument = gql`
    query GetUserSubscription($userId: Int!) {
  userSubscription(userId: $userId) {
    id
    user_id
    subscription_id
    start_date
    end_date
    active
    created_at
    updated_at
    subscription {
      id
      subscription_name
      price
      duration_months
    }
  }
}
    `;

/**
 * __useGetUserSubscription__
 *
 * To run a query within a React component, call `useGetUserSubscription` and pass it any options that fit your needs.
 * When your component renders, `useGetUserSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserSubscription({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetUserSubscription(baseOptions: Apollo.QueryHookOptions<GetUserSubscriptionQuery, GetUserSubscriptionQueryVariables> & ({ variables: GetUserSubscriptionQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUserSubscriptionQuery, GetUserSubscriptionQueryVariables>(GetUserSubscriptionDocument, options);
      }
export function useGetUserSubscriptionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUserSubscriptionQuery, GetUserSubscriptionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUserSubscriptionQuery, GetUserSubscriptionQueryVariables>(GetUserSubscriptionDocument, options);
        }
// @ts-ignore
export function useGetUserSubscriptionSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetUserSubscriptionQuery, GetUserSubscriptionQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserSubscriptionQuery, GetUserSubscriptionQueryVariables>;
export function useGetUserSubscriptionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserSubscriptionQuery, GetUserSubscriptionQueryVariables>): Apollo.UseSuspenseQueryResult<GetUserSubscriptionQuery | undefined, GetUserSubscriptionQueryVariables>;
export function useGetUserSubscriptionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserSubscriptionQuery, GetUserSubscriptionQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetUserSubscriptionQuery, GetUserSubscriptionQueryVariables>(GetUserSubscriptionDocument, options);
        }
export type GetUserSubscriptionHookResult = ReturnType<typeof useGetUserSubscription>;
export type GetUserSubscriptionLazyQueryHookResult = ReturnType<typeof useGetUserSubscriptionLazyQuery>;
export type GetUserSubscriptionSuspenseQueryHookResult = ReturnType<typeof useGetUserSubscriptionSuspenseQuery>;
export type GetUserSubscriptionQueryResult = Apollo.QueryResult<GetUserSubscriptionQuery, GetUserSubscriptionQueryVariables>;