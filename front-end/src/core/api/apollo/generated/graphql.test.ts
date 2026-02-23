import { describe, it, expect } from 'vitest';
import { CheckEmailDocument, useCheckEmailQuery, useCheckEmailLazyQuery, useCheckEmailSuspenseQuery, VerifyResetTokenDocument, useVerifyResetTokenQuery, useVerifyResetTokenLazyQuery, useVerifyResetTokenSuspenseQuery, GetMeDocument, useGetMeQuery, useGetMeLazyQuery, useGetMeSuspenseQuery, LoginDocument, useLoginMutation, RegisterDocument, useRegisterMutation, LogoutDocument, useLogoutMutation, RequestPasswordResetDocument, useRequestPasswordResetMutation, ResetPasswordDocument, useResetPasswordMutation, ChangePasswordDocument, useChangePasswordMutation, GetSessionsDocument, useGetSessionsQuery, useGetSessionsLazyQuery, useGetSessionsSuspenseQuery, GetSessionDocument, useGetSessionQuery, useGetSessionLazyQuery, useGetSessionSuspenseQuery, GetSessionTypesDocument, useGetSessionTypesQuery, useGetSessionTypesLazyQuery, useGetSessionTypesSuspenseQuery, GetInstructorsDocument, useGetInstructorsQuery, useGetInstructorsLazyQuery, useGetInstructorsSuspenseQuery, GetSessionEnrollmentsDocument, useGetSessionEnrollmentsQuery, useGetSessionEnrollmentsLazyQuery, useGetSessionEnrollmentsSuspenseQuery, GetUserEnrollmentsDocument, useGetUserEnrollmentsQuery, useGetUserEnrollmentsLazyQuery, useGetUserEnrollmentsSuspenseQuery, CreateSessionDocument, useCreateSessionMutation, UpdateSessionDocument, useUpdateSessionMutation, DeleteSessionDocument, useDeleteSessionMutation, EnrollUserDocument, useEnrollUserMutation, CancelEnrollmentDocument, useCancelEnrollmentMutation, UpdateEnrollmentStatusDocument, useUpdateEnrollmentStatusMutation, CreateInstructorDocument, useCreateInstructorMutation, UpdateInstructorDocument, useUpdateInstructorMutation, DeleteInstructorDocument, useDeleteInstructorMutation, MessageTypesDocument, useMessageTypesQuery, useMessageTypesLazyQuery, useMessageTypesSuspenseQuery, MessagesReceivedDocument, useMessagesReceivedQuery, useMessagesReceivedLazyQuery, useMessagesReceivedSuspenseQuery, MessagesTrashedDocument, useMessagesTrashedQuery, useMessagesTrashedLazyQuery, useMessagesTrashedSuspenseQuery, UnreadMessagesCountDocument, useUnreadMessagesCountQuery, useUnreadMessagesCountLazyQuery, useUnreadMessagesCountSuspenseQuery, CreateMessageTypeDocument, useCreateMessageTypeMutation, UpdateMessageTypeDocument, useUpdateMessageTypeMutation, DeleteMessageTypeDocument, useDeleteMessageTypeMutation, SendMessageDocument, useSendMessageMutation, MarkMessageAsReadDocument, useMarkMessageAsReadMutation, DeleteReceivedMessageDocument, useDeleteReceivedMessageMutation, RestoreMessageDocument, useRestoreMessageMutation, NotificationsDocument, useNotificationsQuery, useNotificationsLazyQuery, useNotificationsSuspenseQuery, CreateNotificationDocument, useCreateNotificationMutation, MarkNotificationAsReadDocument, useMarkNotificationAsReadMutation, GetProductsDocument, useGetProductsQuery, useGetProductsLazyQuery, useGetProductsSuspenseQuery, GetProductDocument, useGetProductQuery, useGetProductLazyQuery, useGetProductSuspenseQuery, GetProductCategoriesDocument, useGetProductCategoriesQuery, useGetProductCategoriesLazyQuery, useGetProductCategoriesSuspenseQuery, CreateProductDocument, useCreateProductMutation, UpdateProductDocument, useUpdateProductMutation, DeleteProductDocument, useDeleteProductMutation, GetOrdersDocument, useGetOrdersQuery, useGetOrdersLazyQuery, useGetOrdersSuspenseQuery, GetOrderDocument, useGetOrderQuery, useGetOrderLazyQuery, useGetOrderSuspenseQuery, CreateOrderDocument, useCreateOrderMutation, UpdateOrderStatusDocument, useUpdateOrderStatusMutation, GetPaymentsDocument, useGetPaymentsQuery, useGetPaymentsLazyQuery, useGetPaymentsSuspenseQuery, GetPaymentDocument, useGetPaymentQuery, useGetPaymentLazyQuery, useGetPaymentSuspenseQuery, CreatePaymentDocument, useCreatePaymentMutation, ProcessPaymentDocument, useProcessPaymentMutation, GetProductStocksDocument, useGetProductStocksQuery, useGetProductStocksLazyQuery, useGetProductStocksSuspenseQuery, GetStockSizesDocument, useGetStockSizesQuery, useGetStockSizesLazyQuery, useGetStockSizesSuspenseQuery, CreatePaymentIntentForOrderDocument, useCreatePaymentIntentForOrderMutation, ConfirmOrderPaymentDocument, useConfirmOrderPaymentMutation, AttendanceStatsDocument, useAttendanceStatsQuery, useAttendanceStatsLazyQuery, useAttendanceStatsSuspenseQuery, TopMembersDocument, useTopMembersQuery, useTopMembersLazyQuery, useTopMembersSuspenseQuery, MembersCountDocument, useMembersCountQuery, useMembersCountLazyQuery, useMembersCountSuspenseQuery, MembersByGradeDocument, useMembersByGradeQuery, useMembersByGradeLazyQuery, useMembersByGradeSuspenseQuery, MembersByGenderDocument, useMembersByGenderQuery, useMembersByGenderLazyQuery, useMembersByGenderSuspenseQuery, BirthdaysDocument, useBirthdaysQuery, useBirthdaysLazyQuery, useBirthdaysSuspenseQuery, NewMembersDocument, useNewMembersQuery, useNewMembersLazyQuery, useNewMembersSuspenseQuery, TopProductsDocument, useTopProductsQuery, useTopProductsLazyQuery, useTopProductsSuspenseQuery, WeeklySessionsDocument, useWeeklySessionsQuery, useWeeklySessionsLazyQuery, useWeeklySessionsSuspenseQuery, MonthlyPaymentsDocument, useMonthlyPaymentsQuery, useMonthlyPaymentsLazyQuery, useMonthlyPaymentsSuspenseQuery, RecentPaymentsDocument, useRecentPaymentsQuery, useRecentPaymentsLazyQuery, useRecentPaymentsSuspenseQuery, PendingPaymentsDocument, usePendingPaymentsQuery, usePendingPaymentsLazyQuery, usePendingPaymentsSuspenseQuery, OverduePaymentsDocument, useOverduePaymentsQuery, useOverduePaymentsLazyQuery, useOverduePaymentsSuspenseQuery, LastPaymentsDocument, useLastPaymentsQuery, useLastPaymentsLazyQuery, useLastPaymentsSuspenseQuery, PaymentsByMonthDocument, usePaymentsByMonthQuery, usePaymentsByMonthLazyQuery, usePaymentsByMonthSuspenseQuery, ActivePlansDocument, useActivePlansQuery, useActivePlansLazyQuery, useActivePlansSuspenseQuery, RenewalRateDocument, useRenewalRateQuery, useRenewalRateLazyQuery, useRenewalRateSuspenseQuery, MembersByPlanDocument, useMembersByPlanQuery, useMembersByPlanLazyQuery, useMembersByPlanSuspenseQuery, GetUsersDocument, useGetUsersQuery, useGetUsersLazyQuery, useGetUsersSuspenseQuery, GetUserDocument, useGetUserQuery, useGetUserLazyQuery, useGetUserSuspenseQuery, CreateUserDocument, useCreateUserMutation, UpdateUserDocument, useUpdateUserMutation, DeleteUserDocument, useDeleteUserMutation, GetSubscriptionsDocument, useGetSubscriptions, useGetSubscriptionsLazyQuery, useGetSubscriptionsSuspenseQuery, GetSubscriptionDocument, useGetSubscription, useGetSubscriptionLazyQuery, useGetSubscriptionSuspenseQuery, GetGradesDocument, useGetGradesQuery, useGetGradesLazyQuery, useGetGradesSuspenseQuery, GetGradeDocument, useGetGradeQuery, useGetGradeLazyQuery, useGetGradeSuspenseQuery, GetStatusesDocument, useGetStatusesQuery, useGetStatusesLazyQuery, useGetStatusesSuspenseQuery, GetStatusDocument, useGetStatusQuery, useGetStatusLazyQuery, useGetStatusSuspenseQuery, GetGendersDocument, useGetGendersQuery, useGetGendersLazyQuery, useGetGendersSuspenseQuery, GetGenderDocument, useGetGenderQuery, useGetGenderLazyQuery, useGetGenderSuspenseQuery, GetUserSubscriptionDocument, useGetUserSubscription, useGetUserSubscriptionLazyQuery, useGetUserSubscriptionSuspenseQuery, CheckProductByNameAndCategoryDocument, useCheckProductByNameAndCategoryQuery, useCheckProductByNameAndCategoryLazyQuery, useCheckProductByNameAndCategorySuspenseQuery, CheckProductByNameDocument, useCheckProductByNameQuery, useCheckProductByNameLazyQuery, useCheckProductByNameSuspenseQuery, CheckCourseScheduleDocument, useCheckCourseScheduleQuery, useCheckCourseScheduleLazyQuery, useCheckCourseScheduleSuspenseQuery } from './graphql';


describe('CheckEmailDocument', () => {
  it('should be defined', () => {
    expect(CheckEmailDocument).toBeDefined();
    expect(typeof CheckEmailDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => CheckEmailDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = CheckEmailDocument();
    const result2 = CheckEmailDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => CheckEmailDocument(null)).not.toThrow();
    expect(() => CheckEmailDocument(undefined)).not.toThrow();
  });
});


describe('useCheckEmailQuery', () => {
  it('should be defined', () => {
    expect(useCheckEmailQuery).toBeDefined();
    expect(typeof useCheckEmailQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useCheckEmailQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useCheckEmailQuery();
    const result2 = useCheckEmailQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useCheckEmailQuery(null)).not.toThrow();
    expect(() => useCheckEmailQuery(undefined)).not.toThrow();
  });
});


describe('useCheckEmailLazyQuery', () => {
  it('should be defined', () => {
    expect(useCheckEmailLazyQuery).toBeDefined();
    expect(typeof useCheckEmailLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useCheckEmailLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useCheckEmailLazyQuery();
    const result2 = useCheckEmailLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useCheckEmailLazyQuery(null)).not.toThrow();
    expect(() => useCheckEmailLazyQuery(undefined)).not.toThrow();
  });
});


describe('useCheckEmailSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useCheckEmailSuspenseQuery).toBeDefined();
    expect(typeof useCheckEmailSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useCheckEmailSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useCheckEmailSuspenseQuery();
    const result2 = useCheckEmailSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useCheckEmailSuspenseQuery(null)).not.toThrow();
    expect(() => useCheckEmailSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('VerifyResetTokenDocument', () => {
  it('should be defined', () => {
    expect(VerifyResetTokenDocument).toBeDefined();
    expect(typeof VerifyResetTokenDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => VerifyResetTokenDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = VerifyResetTokenDocument();
    const result2 = VerifyResetTokenDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => VerifyResetTokenDocument(null)).not.toThrow();
    expect(() => VerifyResetTokenDocument(undefined)).not.toThrow();
  });
});


describe('useVerifyResetTokenQuery', () => {
  it('should be defined', () => {
    expect(useVerifyResetTokenQuery).toBeDefined();
    expect(typeof useVerifyResetTokenQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useVerifyResetTokenQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useVerifyResetTokenQuery();
    const result2 = useVerifyResetTokenQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useVerifyResetTokenQuery(null)).not.toThrow();
    expect(() => useVerifyResetTokenQuery(undefined)).not.toThrow();
  });
});


describe('useVerifyResetTokenLazyQuery', () => {
  it('should be defined', () => {
    expect(useVerifyResetTokenLazyQuery).toBeDefined();
    expect(typeof useVerifyResetTokenLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useVerifyResetTokenLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useVerifyResetTokenLazyQuery();
    const result2 = useVerifyResetTokenLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useVerifyResetTokenLazyQuery(null)).not.toThrow();
    expect(() => useVerifyResetTokenLazyQuery(undefined)).not.toThrow();
  });
});


describe('useVerifyResetTokenSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useVerifyResetTokenSuspenseQuery).toBeDefined();
    expect(typeof useVerifyResetTokenSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useVerifyResetTokenSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useVerifyResetTokenSuspenseQuery();
    const result2 = useVerifyResetTokenSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useVerifyResetTokenSuspenseQuery(null)).not.toThrow();
    expect(() => useVerifyResetTokenSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('GetMeDocument', () => {
  it('should be defined', () => {
    expect(GetMeDocument).toBeDefined();
    expect(typeof GetMeDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetMeDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetMeDocument();
    const result2 = GetMeDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetMeDocument(null)).not.toThrow();
    expect(() => GetMeDocument(undefined)).not.toThrow();
  });
});


describe('useGetMeQuery', () => {
  it('should be defined', () => {
    expect(useGetMeQuery).toBeDefined();
    expect(typeof useGetMeQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetMeQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetMeQuery();
    const result2 = useGetMeQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetMeQuery(null)).not.toThrow();
    expect(() => useGetMeQuery(undefined)).not.toThrow();
  });
});


describe('useGetMeLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetMeLazyQuery).toBeDefined();
    expect(typeof useGetMeLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetMeLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetMeLazyQuery();
    const result2 = useGetMeLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetMeLazyQuery(null)).not.toThrow();
    expect(() => useGetMeLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetMeSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetMeSuspenseQuery).toBeDefined();
    expect(typeof useGetMeSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetMeSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetMeSuspenseQuery();
    const result2 = useGetMeSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetMeSuspenseQuery(null)).not.toThrow();
    expect(() => useGetMeSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('LoginDocument', () => {
  it('should be defined', () => {
    expect(LoginDocument).toBeDefined();
    expect(typeof LoginDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => LoginDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = LoginDocument();
    const result2 = LoginDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => LoginDocument(null)).not.toThrow();
    expect(() => LoginDocument(undefined)).not.toThrow();
  });
});


describe('useLoginMutation', () => {
  it('should be defined', () => {
    expect(useLoginMutation).toBeDefined();
    expect(typeof useLoginMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useLoginMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useLoginMutation();
    const result2 = useLoginMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useLoginMutation(null)).not.toThrow();
    expect(() => useLoginMutation(undefined)).not.toThrow();
  });
});


describe('RegisterDocument', () => {
  it('should be defined', () => {
    expect(RegisterDocument).toBeDefined();
    expect(typeof RegisterDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => RegisterDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = RegisterDocument();
    const result2 = RegisterDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => RegisterDocument(null)).not.toThrow();
    expect(() => RegisterDocument(undefined)).not.toThrow();
  });
});


describe('useRegisterMutation', () => {
  it('should be defined', () => {
    expect(useRegisterMutation).toBeDefined();
    expect(typeof useRegisterMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useRegisterMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useRegisterMutation();
    const result2 = useRegisterMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useRegisterMutation(null)).not.toThrow();
    expect(() => useRegisterMutation(undefined)).not.toThrow();
  });
});


describe('LogoutDocument', () => {
  it('should be defined', () => {
    expect(LogoutDocument).toBeDefined();
    expect(typeof LogoutDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => LogoutDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = LogoutDocument();
    const result2 = LogoutDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => LogoutDocument(null)).not.toThrow();
    expect(() => LogoutDocument(undefined)).not.toThrow();
  });
});


describe('useLogoutMutation', () => {
  it('should be defined', () => {
    expect(useLogoutMutation).toBeDefined();
    expect(typeof useLogoutMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useLogoutMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useLogoutMutation();
    const result2 = useLogoutMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useLogoutMutation(null)).not.toThrow();
    expect(() => useLogoutMutation(undefined)).not.toThrow();
  });
});


describe('RequestPasswordResetDocument', () => {
  it('should be defined', () => {
    expect(RequestPasswordResetDocument).toBeDefined();
    expect(typeof RequestPasswordResetDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => RequestPasswordResetDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = RequestPasswordResetDocument();
    const result2 = RequestPasswordResetDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => RequestPasswordResetDocument(null)).not.toThrow();
    expect(() => RequestPasswordResetDocument(undefined)).not.toThrow();
  });
});


describe('useRequestPasswordResetMutation', () => {
  it('should be defined', () => {
    expect(useRequestPasswordResetMutation).toBeDefined();
    expect(typeof useRequestPasswordResetMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useRequestPasswordResetMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useRequestPasswordResetMutation();
    const result2 = useRequestPasswordResetMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useRequestPasswordResetMutation(null)).not.toThrow();
    expect(() => useRequestPasswordResetMutation(undefined)).not.toThrow();
  });
});


describe('ResetPasswordDocument', () => {
  it('should be defined', () => {
    expect(ResetPasswordDocument).toBeDefined();
    expect(typeof ResetPasswordDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => ResetPasswordDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = ResetPasswordDocument();
    const result2 = ResetPasswordDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => ResetPasswordDocument(null)).not.toThrow();
    expect(() => ResetPasswordDocument(undefined)).not.toThrow();
  });
});


describe('useResetPasswordMutation', () => {
  it('should be defined', () => {
    expect(useResetPasswordMutation).toBeDefined();
    expect(typeof useResetPasswordMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useResetPasswordMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useResetPasswordMutation();
    const result2 = useResetPasswordMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useResetPasswordMutation(null)).not.toThrow();
    expect(() => useResetPasswordMutation(undefined)).not.toThrow();
  });
});


describe('ChangePasswordDocument', () => {
  it('should be defined', () => {
    expect(ChangePasswordDocument).toBeDefined();
    expect(typeof ChangePasswordDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => ChangePasswordDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = ChangePasswordDocument();
    const result2 = ChangePasswordDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => ChangePasswordDocument(null)).not.toThrow();
    expect(() => ChangePasswordDocument(undefined)).not.toThrow();
  });
});


describe('useChangePasswordMutation', () => {
  it('should be defined', () => {
    expect(useChangePasswordMutation).toBeDefined();
    expect(typeof useChangePasswordMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useChangePasswordMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useChangePasswordMutation();
    const result2 = useChangePasswordMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useChangePasswordMutation(null)).not.toThrow();
    expect(() => useChangePasswordMutation(undefined)).not.toThrow();
  });
});


describe('GetSessionsDocument', () => {
  it('should be defined', () => {
    expect(GetSessionsDocument).toBeDefined();
    expect(typeof GetSessionsDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetSessionsDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetSessionsDocument();
    const result2 = GetSessionsDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetSessionsDocument(null)).not.toThrow();
    expect(() => GetSessionsDocument(undefined)).not.toThrow();
  });
});


describe('useGetSessionsQuery', () => {
  it('should be defined', () => {
    expect(useGetSessionsQuery).toBeDefined();
    expect(typeof useGetSessionsQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetSessionsQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetSessionsQuery();
    const result2 = useGetSessionsQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetSessionsQuery(null)).not.toThrow();
    expect(() => useGetSessionsQuery(undefined)).not.toThrow();
  });
});


describe('useGetSessionsLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetSessionsLazyQuery).toBeDefined();
    expect(typeof useGetSessionsLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetSessionsLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetSessionsLazyQuery();
    const result2 = useGetSessionsLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetSessionsLazyQuery(null)).not.toThrow();
    expect(() => useGetSessionsLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetSessionsSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetSessionsSuspenseQuery).toBeDefined();
    expect(typeof useGetSessionsSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetSessionsSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetSessionsSuspenseQuery();
    const result2 = useGetSessionsSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetSessionsSuspenseQuery(null)).not.toThrow();
    expect(() => useGetSessionsSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('GetSessionDocument', () => {
  it('should be defined', () => {
    expect(GetSessionDocument).toBeDefined();
    expect(typeof GetSessionDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetSessionDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetSessionDocument();
    const result2 = GetSessionDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetSessionDocument(null)).not.toThrow();
    expect(() => GetSessionDocument(undefined)).not.toThrow();
  });
});


describe('useGetSessionQuery', () => {
  it('should be defined', () => {
    expect(useGetSessionQuery).toBeDefined();
    expect(typeof useGetSessionQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetSessionQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetSessionQuery();
    const result2 = useGetSessionQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetSessionQuery(null)).not.toThrow();
    expect(() => useGetSessionQuery(undefined)).not.toThrow();
  });
});


describe('useGetSessionLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetSessionLazyQuery).toBeDefined();
    expect(typeof useGetSessionLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetSessionLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetSessionLazyQuery();
    const result2 = useGetSessionLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetSessionLazyQuery(null)).not.toThrow();
    expect(() => useGetSessionLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetSessionSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetSessionSuspenseQuery).toBeDefined();
    expect(typeof useGetSessionSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetSessionSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetSessionSuspenseQuery();
    const result2 = useGetSessionSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetSessionSuspenseQuery(null)).not.toThrow();
    expect(() => useGetSessionSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('GetSessionTypesDocument', () => {
  it('should be defined', () => {
    expect(GetSessionTypesDocument).toBeDefined();
    expect(typeof GetSessionTypesDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetSessionTypesDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetSessionTypesDocument();
    const result2 = GetSessionTypesDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetSessionTypesDocument(null)).not.toThrow();
    expect(() => GetSessionTypesDocument(undefined)).not.toThrow();
  });
});


describe('useGetSessionTypesQuery', () => {
  it('should be defined', () => {
    expect(useGetSessionTypesQuery).toBeDefined();
    expect(typeof useGetSessionTypesQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetSessionTypesQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetSessionTypesQuery();
    const result2 = useGetSessionTypesQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetSessionTypesQuery(null)).not.toThrow();
    expect(() => useGetSessionTypesQuery(undefined)).not.toThrow();
  });
});


describe('useGetSessionTypesLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetSessionTypesLazyQuery).toBeDefined();
    expect(typeof useGetSessionTypesLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetSessionTypesLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetSessionTypesLazyQuery();
    const result2 = useGetSessionTypesLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetSessionTypesLazyQuery(null)).not.toThrow();
    expect(() => useGetSessionTypesLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetSessionTypesSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetSessionTypesSuspenseQuery).toBeDefined();
    expect(typeof useGetSessionTypesSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetSessionTypesSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetSessionTypesSuspenseQuery();
    const result2 = useGetSessionTypesSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetSessionTypesSuspenseQuery(null)).not.toThrow();
    expect(() => useGetSessionTypesSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('GetInstructorsDocument', () => {
  it('should be defined', () => {
    expect(GetInstructorsDocument).toBeDefined();
    expect(typeof GetInstructorsDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetInstructorsDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetInstructorsDocument();
    const result2 = GetInstructorsDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetInstructorsDocument(null)).not.toThrow();
    expect(() => GetInstructorsDocument(undefined)).not.toThrow();
  });
});


describe('useGetInstructorsQuery', () => {
  it('should be defined', () => {
    expect(useGetInstructorsQuery).toBeDefined();
    expect(typeof useGetInstructorsQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetInstructorsQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetInstructorsQuery();
    const result2 = useGetInstructorsQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetInstructorsQuery(null)).not.toThrow();
    expect(() => useGetInstructorsQuery(undefined)).not.toThrow();
  });
});


describe('useGetInstructorsLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetInstructorsLazyQuery).toBeDefined();
    expect(typeof useGetInstructorsLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetInstructorsLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetInstructorsLazyQuery();
    const result2 = useGetInstructorsLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetInstructorsLazyQuery(null)).not.toThrow();
    expect(() => useGetInstructorsLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetInstructorsSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetInstructorsSuspenseQuery).toBeDefined();
    expect(typeof useGetInstructorsSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetInstructorsSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetInstructorsSuspenseQuery();
    const result2 = useGetInstructorsSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetInstructorsSuspenseQuery(null)).not.toThrow();
    expect(() => useGetInstructorsSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('GetSessionEnrollmentsDocument', () => {
  it('should be defined', () => {
    expect(GetSessionEnrollmentsDocument).toBeDefined();
    expect(typeof GetSessionEnrollmentsDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetSessionEnrollmentsDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetSessionEnrollmentsDocument();
    const result2 = GetSessionEnrollmentsDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetSessionEnrollmentsDocument(null)).not.toThrow();
    expect(() => GetSessionEnrollmentsDocument(undefined)).not.toThrow();
  });
});


describe('useGetSessionEnrollmentsQuery', () => {
  it('should be defined', () => {
    expect(useGetSessionEnrollmentsQuery).toBeDefined();
    expect(typeof useGetSessionEnrollmentsQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetSessionEnrollmentsQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetSessionEnrollmentsQuery();
    const result2 = useGetSessionEnrollmentsQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetSessionEnrollmentsQuery(null)).not.toThrow();
    expect(() => useGetSessionEnrollmentsQuery(undefined)).not.toThrow();
  });
});


describe('useGetSessionEnrollmentsLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetSessionEnrollmentsLazyQuery).toBeDefined();
    expect(typeof useGetSessionEnrollmentsLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetSessionEnrollmentsLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetSessionEnrollmentsLazyQuery();
    const result2 = useGetSessionEnrollmentsLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetSessionEnrollmentsLazyQuery(null)).not.toThrow();
    expect(() => useGetSessionEnrollmentsLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetSessionEnrollmentsSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetSessionEnrollmentsSuspenseQuery).toBeDefined();
    expect(typeof useGetSessionEnrollmentsSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetSessionEnrollmentsSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetSessionEnrollmentsSuspenseQuery();
    const result2 = useGetSessionEnrollmentsSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetSessionEnrollmentsSuspenseQuery(null)).not.toThrow();
    expect(() => useGetSessionEnrollmentsSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('GetUserEnrollmentsDocument', () => {
  it('should be defined', () => {
    expect(GetUserEnrollmentsDocument).toBeDefined();
    expect(typeof GetUserEnrollmentsDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetUserEnrollmentsDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetUserEnrollmentsDocument();
    const result2 = GetUserEnrollmentsDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetUserEnrollmentsDocument(null)).not.toThrow();
    expect(() => GetUserEnrollmentsDocument(undefined)).not.toThrow();
  });
});


describe('useGetUserEnrollmentsQuery', () => {
  it('should be defined', () => {
    expect(useGetUserEnrollmentsQuery).toBeDefined();
    expect(typeof useGetUserEnrollmentsQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetUserEnrollmentsQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetUserEnrollmentsQuery();
    const result2 = useGetUserEnrollmentsQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetUserEnrollmentsQuery(null)).not.toThrow();
    expect(() => useGetUserEnrollmentsQuery(undefined)).not.toThrow();
  });
});


describe('useGetUserEnrollmentsLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetUserEnrollmentsLazyQuery).toBeDefined();
    expect(typeof useGetUserEnrollmentsLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetUserEnrollmentsLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetUserEnrollmentsLazyQuery();
    const result2 = useGetUserEnrollmentsLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetUserEnrollmentsLazyQuery(null)).not.toThrow();
    expect(() => useGetUserEnrollmentsLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetUserEnrollmentsSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetUserEnrollmentsSuspenseQuery).toBeDefined();
    expect(typeof useGetUserEnrollmentsSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetUserEnrollmentsSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetUserEnrollmentsSuspenseQuery();
    const result2 = useGetUserEnrollmentsSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetUserEnrollmentsSuspenseQuery(null)).not.toThrow();
    expect(() => useGetUserEnrollmentsSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('CreateSessionDocument', () => {
  it('should be defined', () => {
    expect(CreateSessionDocument).toBeDefined();
    expect(typeof CreateSessionDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => CreateSessionDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = CreateSessionDocument();
    const result2 = CreateSessionDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => CreateSessionDocument(null)).not.toThrow();
    expect(() => CreateSessionDocument(undefined)).not.toThrow();
  });
});


describe('useCreateSessionMutation', () => {
  it('should be defined', () => {
    expect(useCreateSessionMutation).toBeDefined();
    expect(typeof useCreateSessionMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useCreateSessionMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useCreateSessionMutation();
    const result2 = useCreateSessionMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useCreateSessionMutation(null)).not.toThrow();
    expect(() => useCreateSessionMutation(undefined)).not.toThrow();
  });
});


describe('UpdateSessionDocument', () => {
  it('should be defined', () => {
    expect(UpdateSessionDocument).toBeDefined();
    expect(typeof UpdateSessionDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => UpdateSessionDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = UpdateSessionDocument();
    const result2 = UpdateSessionDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => UpdateSessionDocument(null)).not.toThrow();
    expect(() => UpdateSessionDocument(undefined)).not.toThrow();
  });
});


describe('useUpdateSessionMutation', () => {
  it('should be defined', () => {
    expect(useUpdateSessionMutation).toBeDefined();
    expect(typeof useUpdateSessionMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useUpdateSessionMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useUpdateSessionMutation();
    const result2 = useUpdateSessionMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useUpdateSessionMutation(null)).not.toThrow();
    expect(() => useUpdateSessionMutation(undefined)).not.toThrow();
  });
});


describe('DeleteSessionDocument', () => {
  it('should be defined', () => {
    expect(DeleteSessionDocument).toBeDefined();
    expect(typeof DeleteSessionDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => DeleteSessionDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = DeleteSessionDocument();
    const result2 = DeleteSessionDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => DeleteSessionDocument(null)).not.toThrow();
    expect(() => DeleteSessionDocument(undefined)).not.toThrow();
  });
});


describe('useDeleteSessionMutation', () => {
  it('should be defined', () => {
    expect(useDeleteSessionMutation).toBeDefined();
    expect(typeof useDeleteSessionMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useDeleteSessionMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useDeleteSessionMutation();
    const result2 = useDeleteSessionMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useDeleteSessionMutation(null)).not.toThrow();
    expect(() => useDeleteSessionMutation(undefined)).not.toThrow();
  });
});


describe('EnrollUserDocument', () => {
  it('should be defined', () => {
    expect(EnrollUserDocument).toBeDefined();
    expect(typeof EnrollUserDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => EnrollUserDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = EnrollUserDocument();
    const result2 = EnrollUserDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => EnrollUserDocument(null)).not.toThrow();
    expect(() => EnrollUserDocument(undefined)).not.toThrow();
  });
});


describe('useEnrollUserMutation', () => {
  it('should be defined', () => {
    expect(useEnrollUserMutation).toBeDefined();
    expect(typeof useEnrollUserMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useEnrollUserMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useEnrollUserMutation();
    const result2 = useEnrollUserMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useEnrollUserMutation(null)).not.toThrow();
    expect(() => useEnrollUserMutation(undefined)).not.toThrow();
  });
});


describe('CancelEnrollmentDocument', () => {
  it('should be defined', () => {
    expect(CancelEnrollmentDocument).toBeDefined();
    expect(typeof CancelEnrollmentDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => CancelEnrollmentDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = CancelEnrollmentDocument();
    const result2 = CancelEnrollmentDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => CancelEnrollmentDocument(null)).not.toThrow();
    expect(() => CancelEnrollmentDocument(undefined)).not.toThrow();
  });
});


describe('useCancelEnrollmentMutation', () => {
  it('should be defined', () => {
    expect(useCancelEnrollmentMutation).toBeDefined();
    expect(typeof useCancelEnrollmentMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useCancelEnrollmentMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useCancelEnrollmentMutation();
    const result2 = useCancelEnrollmentMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useCancelEnrollmentMutation(null)).not.toThrow();
    expect(() => useCancelEnrollmentMutation(undefined)).not.toThrow();
  });
});


describe('UpdateEnrollmentStatusDocument', () => {
  it('should be defined', () => {
    expect(UpdateEnrollmentStatusDocument).toBeDefined();
    expect(typeof UpdateEnrollmentStatusDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => UpdateEnrollmentStatusDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = UpdateEnrollmentStatusDocument();
    const result2 = UpdateEnrollmentStatusDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => UpdateEnrollmentStatusDocument(null)).not.toThrow();
    expect(() => UpdateEnrollmentStatusDocument(undefined)).not.toThrow();
  });
});


describe('useUpdateEnrollmentStatusMutation', () => {
  it('should be defined', () => {
    expect(useUpdateEnrollmentStatusMutation).toBeDefined();
    expect(typeof useUpdateEnrollmentStatusMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useUpdateEnrollmentStatusMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useUpdateEnrollmentStatusMutation();
    const result2 = useUpdateEnrollmentStatusMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useUpdateEnrollmentStatusMutation(null)).not.toThrow();
    expect(() => useUpdateEnrollmentStatusMutation(undefined)).not.toThrow();
  });
});


describe('CreateInstructorDocument', () => {
  it('should be defined', () => {
    expect(CreateInstructorDocument).toBeDefined();
    expect(typeof CreateInstructorDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => CreateInstructorDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = CreateInstructorDocument();
    const result2 = CreateInstructorDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => CreateInstructorDocument(null)).not.toThrow();
    expect(() => CreateInstructorDocument(undefined)).not.toThrow();
  });
});


describe('useCreateInstructorMutation', () => {
  it('should be defined', () => {
    expect(useCreateInstructorMutation).toBeDefined();
    expect(typeof useCreateInstructorMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useCreateInstructorMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useCreateInstructorMutation();
    const result2 = useCreateInstructorMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useCreateInstructorMutation(null)).not.toThrow();
    expect(() => useCreateInstructorMutation(undefined)).not.toThrow();
  });
});


describe('UpdateInstructorDocument', () => {
  it('should be defined', () => {
    expect(UpdateInstructorDocument).toBeDefined();
    expect(typeof UpdateInstructorDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => UpdateInstructorDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = UpdateInstructorDocument();
    const result2 = UpdateInstructorDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => UpdateInstructorDocument(null)).not.toThrow();
    expect(() => UpdateInstructorDocument(undefined)).not.toThrow();
  });
});


describe('useUpdateInstructorMutation', () => {
  it('should be defined', () => {
    expect(useUpdateInstructorMutation).toBeDefined();
    expect(typeof useUpdateInstructorMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useUpdateInstructorMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useUpdateInstructorMutation();
    const result2 = useUpdateInstructorMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useUpdateInstructorMutation(null)).not.toThrow();
    expect(() => useUpdateInstructorMutation(undefined)).not.toThrow();
  });
});


describe('DeleteInstructorDocument', () => {
  it('should be defined', () => {
    expect(DeleteInstructorDocument).toBeDefined();
    expect(typeof DeleteInstructorDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => DeleteInstructorDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = DeleteInstructorDocument();
    const result2 = DeleteInstructorDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => DeleteInstructorDocument(null)).not.toThrow();
    expect(() => DeleteInstructorDocument(undefined)).not.toThrow();
  });
});


describe('useDeleteInstructorMutation', () => {
  it('should be defined', () => {
    expect(useDeleteInstructorMutation).toBeDefined();
    expect(typeof useDeleteInstructorMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useDeleteInstructorMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useDeleteInstructorMutation();
    const result2 = useDeleteInstructorMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useDeleteInstructorMutation(null)).not.toThrow();
    expect(() => useDeleteInstructorMutation(undefined)).not.toThrow();
  });
});


describe('MessageTypesDocument', () => {
  it('should be defined', () => {
    expect(MessageTypesDocument).toBeDefined();
    expect(typeof MessageTypesDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => MessageTypesDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = MessageTypesDocument();
    const result2 = MessageTypesDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => MessageTypesDocument(null)).not.toThrow();
    expect(() => MessageTypesDocument(undefined)).not.toThrow();
  });
});


describe('useMessageTypesQuery', () => {
  it('should be defined', () => {
    expect(useMessageTypesQuery).toBeDefined();
    expect(typeof useMessageTypesQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMessageTypesQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMessageTypesQuery();
    const result2 = useMessageTypesQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMessageTypesQuery(null)).not.toThrow();
    expect(() => useMessageTypesQuery(undefined)).not.toThrow();
  });
});


describe('useMessageTypesLazyQuery', () => {
  it('should be defined', () => {
    expect(useMessageTypesLazyQuery).toBeDefined();
    expect(typeof useMessageTypesLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMessageTypesLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMessageTypesLazyQuery();
    const result2 = useMessageTypesLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMessageTypesLazyQuery(null)).not.toThrow();
    expect(() => useMessageTypesLazyQuery(undefined)).not.toThrow();
  });
});


describe('useMessageTypesSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useMessageTypesSuspenseQuery).toBeDefined();
    expect(typeof useMessageTypesSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMessageTypesSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMessageTypesSuspenseQuery();
    const result2 = useMessageTypesSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMessageTypesSuspenseQuery(null)).not.toThrow();
    expect(() => useMessageTypesSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('MessagesReceivedDocument', () => {
  it('should be defined', () => {
    expect(MessagesReceivedDocument).toBeDefined();
    expect(typeof MessagesReceivedDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => MessagesReceivedDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = MessagesReceivedDocument();
    const result2 = MessagesReceivedDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => MessagesReceivedDocument(null)).not.toThrow();
    expect(() => MessagesReceivedDocument(undefined)).not.toThrow();
  });
});


describe('useMessagesReceivedQuery', () => {
  it('should be defined', () => {
    expect(useMessagesReceivedQuery).toBeDefined();
    expect(typeof useMessagesReceivedQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMessagesReceivedQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMessagesReceivedQuery();
    const result2 = useMessagesReceivedQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMessagesReceivedQuery(null)).not.toThrow();
    expect(() => useMessagesReceivedQuery(undefined)).not.toThrow();
  });
});


describe('useMessagesReceivedLazyQuery', () => {
  it('should be defined', () => {
    expect(useMessagesReceivedLazyQuery).toBeDefined();
    expect(typeof useMessagesReceivedLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMessagesReceivedLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMessagesReceivedLazyQuery();
    const result2 = useMessagesReceivedLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMessagesReceivedLazyQuery(null)).not.toThrow();
    expect(() => useMessagesReceivedLazyQuery(undefined)).not.toThrow();
  });
});


describe('useMessagesReceivedSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useMessagesReceivedSuspenseQuery).toBeDefined();
    expect(typeof useMessagesReceivedSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMessagesReceivedSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMessagesReceivedSuspenseQuery();
    const result2 = useMessagesReceivedSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMessagesReceivedSuspenseQuery(null)).not.toThrow();
    expect(() => useMessagesReceivedSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('MessagesTrashedDocument', () => {
  it('should be defined', () => {
    expect(MessagesTrashedDocument).toBeDefined();
    expect(typeof MessagesTrashedDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => MessagesTrashedDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = MessagesTrashedDocument();
    const result2 = MessagesTrashedDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => MessagesTrashedDocument(null)).not.toThrow();
    expect(() => MessagesTrashedDocument(undefined)).not.toThrow();
  });
});


describe('useMessagesTrashedQuery', () => {
  it('should be defined', () => {
    expect(useMessagesTrashedQuery).toBeDefined();
    expect(typeof useMessagesTrashedQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMessagesTrashedQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMessagesTrashedQuery();
    const result2 = useMessagesTrashedQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMessagesTrashedQuery(null)).not.toThrow();
    expect(() => useMessagesTrashedQuery(undefined)).not.toThrow();
  });
});


describe('useMessagesTrashedLazyQuery', () => {
  it('should be defined', () => {
    expect(useMessagesTrashedLazyQuery).toBeDefined();
    expect(typeof useMessagesTrashedLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMessagesTrashedLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMessagesTrashedLazyQuery();
    const result2 = useMessagesTrashedLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMessagesTrashedLazyQuery(null)).not.toThrow();
    expect(() => useMessagesTrashedLazyQuery(undefined)).not.toThrow();
  });
});


describe('useMessagesTrashedSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useMessagesTrashedSuspenseQuery).toBeDefined();
    expect(typeof useMessagesTrashedSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMessagesTrashedSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMessagesTrashedSuspenseQuery();
    const result2 = useMessagesTrashedSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMessagesTrashedSuspenseQuery(null)).not.toThrow();
    expect(() => useMessagesTrashedSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('UnreadMessagesCountDocument', () => {
  it('should be defined', () => {
    expect(UnreadMessagesCountDocument).toBeDefined();
    expect(typeof UnreadMessagesCountDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => UnreadMessagesCountDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = UnreadMessagesCountDocument();
    const result2 = UnreadMessagesCountDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => UnreadMessagesCountDocument(null)).not.toThrow();
    expect(() => UnreadMessagesCountDocument(undefined)).not.toThrow();
  });
});


describe('useUnreadMessagesCountQuery', () => {
  it('should be defined', () => {
    expect(useUnreadMessagesCountQuery).toBeDefined();
    expect(typeof useUnreadMessagesCountQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useUnreadMessagesCountQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useUnreadMessagesCountQuery();
    const result2 = useUnreadMessagesCountQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useUnreadMessagesCountQuery(null)).not.toThrow();
    expect(() => useUnreadMessagesCountQuery(undefined)).not.toThrow();
  });
});


describe('useUnreadMessagesCountLazyQuery', () => {
  it('should be defined', () => {
    expect(useUnreadMessagesCountLazyQuery).toBeDefined();
    expect(typeof useUnreadMessagesCountLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useUnreadMessagesCountLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useUnreadMessagesCountLazyQuery();
    const result2 = useUnreadMessagesCountLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useUnreadMessagesCountLazyQuery(null)).not.toThrow();
    expect(() => useUnreadMessagesCountLazyQuery(undefined)).not.toThrow();
  });
});


describe('useUnreadMessagesCountSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useUnreadMessagesCountSuspenseQuery).toBeDefined();
    expect(typeof useUnreadMessagesCountSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useUnreadMessagesCountSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useUnreadMessagesCountSuspenseQuery();
    const result2 = useUnreadMessagesCountSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useUnreadMessagesCountSuspenseQuery(null)).not.toThrow();
    expect(() => useUnreadMessagesCountSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('CreateMessageTypeDocument', () => {
  it('should be defined', () => {
    expect(CreateMessageTypeDocument).toBeDefined();
    expect(typeof CreateMessageTypeDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => CreateMessageTypeDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = CreateMessageTypeDocument();
    const result2 = CreateMessageTypeDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => CreateMessageTypeDocument(null)).not.toThrow();
    expect(() => CreateMessageTypeDocument(undefined)).not.toThrow();
  });
});


describe('useCreateMessageTypeMutation', () => {
  it('should be defined', () => {
    expect(useCreateMessageTypeMutation).toBeDefined();
    expect(typeof useCreateMessageTypeMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useCreateMessageTypeMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useCreateMessageTypeMutation();
    const result2 = useCreateMessageTypeMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useCreateMessageTypeMutation(null)).not.toThrow();
    expect(() => useCreateMessageTypeMutation(undefined)).not.toThrow();
  });
});


describe('UpdateMessageTypeDocument', () => {
  it('should be defined', () => {
    expect(UpdateMessageTypeDocument).toBeDefined();
    expect(typeof UpdateMessageTypeDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => UpdateMessageTypeDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = UpdateMessageTypeDocument();
    const result2 = UpdateMessageTypeDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => UpdateMessageTypeDocument(null)).not.toThrow();
    expect(() => UpdateMessageTypeDocument(undefined)).not.toThrow();
  });
});


describe('useUpdateMessageTypeMutation', () => {
  it('should be defined', () => {
    expect(useUpdateMessageTypeMutation).toBeDefined();
    expect(typeof useUpdateMessageTypeMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useUpdateMessageTypeMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useUpdateMessageTypeMutation();
    const result2 = useUpdateMessageTypeMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useUpdateMessageTypeMutation(null)).not.toThrow();
    expect(() => useUpdateMessageTypeMutation(undefined)).not.toThrow();
  });
});


describe('DeleteMessageTypeDocument', () => {
  it('should be defined', () => {
    expect(DeleteMessageTypeDocument).toBeDefined();
    expect(typeof DeleteMessageTypeDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => DeleteMessageTypeDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = DeleteMessageTypeDocument();
    const result2 = DeleteMessageTypeDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => DeleteMessageTypeDocument(null)).not.toThrow();
    expect(() => DeleteMessageTypeDocument(undefined)).not.toThrow();
  });
});


describe('useDeleteMessageTypeMutation', () => {
  it('should be defined', () => {
    expect(useDeleteMessageTypeMutation).toBeDefined();
    expect(typeof useDeleteMessageTypeMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useDeleteMessageTypeMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useDeleteMessageTypeMutation();
    const result2 = useDeleteMessageTypeMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useDeleteMessageTypeMutation(null)).not.toThrow();
    expect(() => useDeleteMessageTypeMutation(undefined)).not.toThrow();
  });
});


describe('SendMessageDocument', () => {
  it('should be defined', () => {
    expect(SendMessageDocument).toBeDefined();
    expect(typeof SendMessageDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => SendMessageDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = SendMessageDocument();
    const result2 = SendMessageDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => SendMessageDocument(null)).not.toThrow();
    expect(() => SendMessageDocument(undefined)).not.toThrow();
  });
});


describe('useSendMessageMutation', () => {
  it('should be defined', () => {
    expect(useSendMessageMutation).toBeDefined();
    expect(typeof useSendMessageMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useSendMessageMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useSendMessageMutation();
    const result2 = useSendMessageMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useSendMessageMutation(null)).not.toThrow();
    expect(() => useSendMessageMutation(undefined)).not.toThrow();
  });
});


describe('MarkMessageAsReadDocument', () => {
  it('should be defined', () => {
    expect(MarkMessageAsReadDocument).toBeDefined();
    expect(typeof MarkMessageAsReadDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => MarkMessageAsReadDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = MarkMessageAsReadDocument();
    const result2 = MarkMessageAsReadDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => MarkMessageAsReadDocument(null)).not.toThrow();
    expect(() => MarkMessageAsReadDocument(undefined)).not.toThrow();
  });
});


describe('useMarkMessageAsReadMutation', () => {
  it('should be defined', () => {
    expect(useMarkMessageAsReadMutation).toBeDefined();
    expect(typeof useMarkMessageAsReadMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMarkMessageAsReadMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMarkMessageAsReadMutation();
    const result2 = useMarkMessageAsReadMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMarkMessageAsReadMutation(null)).not.toThrow();
    expect(() => useMarkMessageAsReadMutation(undefined)).not.toThrow();
  });
});


describe('DeleteReceivedMessageDocument', () => {
  it('should be defined', () => {
    expect(DeleteReceivedMessageDocument).toBeDefined();
    expect(typeof DeleteReceivedMessageDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => DeleteReceivedMessageDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = DeleteReceivedMessageDocument();
    const result2 = DeleteReceivedMessageDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => DeleteReceivedMessageDocument(null)).not.toThrow();
    expect(() => DeleteReceivedMessageDocument(undefined)).not.toThrow();
  });
});


describe('useDeleteReceivedMessageMutation', () => {
  it('should be defined', () => {
    expect(useDeleteReceivedMessageMutation).toBeDefined();
    expect(typeof useDeleteReceivedMessageMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useDeleteReceivedMessageMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useDeleteReceivedMessageMutation();
    const result2 = useDeleteReceivedMessageMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useDeleteReceivedMessageMutation(null)).not.toThrow();
    expect(() => useDeleteReceivedMessageMutation(undefined)).not.toThrow();
  });
});


describe('RestoreMessageDocument', () => {
  it('should be defined', () => {
    expect(RestoreMessageDocument).toBeDefined();
    expect(typeof RestoreMessageDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => RestoreMessageDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = RestoreMessageDocument();
    const result2 = RestoreMessageDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => RestoreMessageDocument(null)).not.toThrow();
    expect(() => RestoreMessageDocument(undefined)).not.toThrow();
  });
});


describe('useRestoreMessageMutation', () => {
  it('should be defined', () => {
    expect(useRestoreMessageMutation).toBeDefined();
    expect(typeof useRestoreMessageMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useRestoreMessageMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useRestoreMessageMutation();
    const result2 = useRestoreMessageMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useRestoreMessageMutation(null)).not.toThrow();
    expect(() => useRestoreMessageMutation(undefined)).not.toThrow();
  });
});


describe('NotificationsDocument', () => {
  it('should be defined', () => {
    expect(NotificationsDocument).toBeDefined();
    expect(typeof NotificationsDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => NotificationsDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = NotificationsDocument();
    const result2 = NotificationsDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => NotificationsDocument(null)).not.toThrow();
    expect(() => NotificationsDocument(undefined)).not.toThrow();
  });
});


describe('useNotificationsQuery', () => {
  it('should be defined', () => {
    expect(useNotificationsQuery).toBeDefined();
    expect(typeof useNotificationsQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useNotificationsQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useNotificationsQuery();
    const result2 = useNotificationsQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useNotificationsQuery(null)).not.toThrow();
    expect(() => useNotificationsQuery(undefined)).not.toThrow();
  });
});


describe('useNotificationsLazyQuery', () => {
  it('should be defined', () => {
    expect(useNotificationsLazyQuery).toBeDefined();
    expect(typeof useNotificationsLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useNotificationsLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useNotificationsLazyQuery();
    const result2 = useNotificationsLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useNotificationsLazyQuery(null)).not.toThrow();
    expect(() => useNotificationsLazyQuery(undefined)).not.toThrow();
  });
});


describe('useNotificationsSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useNotificationsSuspenseQuery).toBeDefined();
    expect(typeof useNotificationsSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useNotificationsSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useNotificationsSuspenseQuery();
    const result2 = useNotificationsSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useNotificationsSuspenseQuery(null)).not.toThrow();
    expect(() => useNotificationsSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('CreateNotificationDocument', () => {
  it('should be defined', () => {
    expect(CreateNotificationDocument).toBeDefined();
    expect(typeof CreateNotificationDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => CreateNotificationDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = CreateNotificationDocument();
    const result2 = CreateNotificationDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => CreateNotificationDocument(null)).not.toThrow();
    expect(() => CreateNotificationDocument(undefined)).not.toThrow();
  });
});


describe('useCreateNotificationMutation', () => {
  it('should be defined', () => {
    expect(useCreateNotificationMutation).toBeDefined();
    expect(typeof useCreateNotificationMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useCreateNotificationMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useCreateNotificationMutation();
    const result2 = useCreateNotificationMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useCreateNotificationMutation(null)).not.toThrow();
    expect(() => useCreateNotificationMutation(undefined)).not.toThrow();
  });
});


describe('MarkNotificationAsReadDocument', () => {
  it('should be defined', () => {
    expect(MarkNotificationAsReadDocument).toBeDefined();
    expect(typeof MarkNotificationAsReadDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => MarkNotificationAsReadDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = MarkNotificationAsReadDocument();
    const result2 = MarkNotificationAsReadDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => MarkNotificationAsReadDocument(null)).not.toThrow();
    expect(() => MarkNotificationAsReadDocument(undefined)).not.toThrow();
  });
});


describe('useMarkNotificationAsReadMutation', () => {
  it('should be defined', () => {
    expect(useMarkNotificationAsReadMutation).toBeDefined();
    expect(typeof useMarkNotificationAsReadMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMarkNotificationAsReadMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMarkNotificationAsReadMutation();
    const result2 = useMarkNotificationAsReadMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMarkNotificationAsReadMutation(null)).not.toThrow();
    expect(() => useMarkNotificationAsReadMutation(undefined)).not.toThrow();
  });
});


describe('GetProductsDocument', () => {
  it('should be defined', () => {
    expect(GetProductsDocument).toBeDefined();
    expect(typeof GetProductsDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetProductsDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetProductsDocument();
    const result2 = GetProductsDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetProductsDocument(null)).not.toThrow();
    expect(() => GetProductsDocument(undefined)).not.toThrow();
  });
});


describe('useGetProductsQuery', () => {
  it('should be defined', () => {
    expect(useGetProductsQuery).toBeDefined();
    expect(typeof useGetProductsQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetProductsQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetProductsQuery();
    const result2 = useGetProductsQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetProductsQuery(null)).not.toThrow();
    expect(() => useGetProductsQuery(undefined)).not.toThrow();
  });
});


describe('useGetProductsLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetProductsLazyQuery).toBeDefined();
    expect(typeof useGetProductsLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetProductsLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetProductsLazyQuery();
    const result2 = useGetProductsLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetProductsLazyQuery(null)).not.toThrow();
    expect(() => useGetProductsLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetProductsSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetProductsSuspenseQuery).toBeDefined();
    expect(typeof useGetProductsSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetProductsSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetProductsSuspenseQuery();
    const result2 = useGetProductsSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetProductsSuspenseQuery(null)).not.toThrow();
    expect(() => useGetProductsSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('GetProductDocument', () => {
  it('should be defined', () => {
    expect(GetProductDocument).toBeDefined();
    expect(typeof GetProductDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetProductDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetProductDocument();
    const result2 = GetProductDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetProductDocument(null)).not.toThrow();
    expect(() => GetProductDocument(undefined)).not.toThrow();
  });
});


describe('useGetProductQuery', () => {
  it('should be defined', () => {
    expect(useGetProductQuery).toBeDefined();
    expect(typeof useGetProductQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetProductQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetProductQuery();
    const result2 = useGetProductQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetProductQuery(null)).not.toThrow();
    expect(() => useGetProductQuery(undefined)).not.toThrow();
  });
});


describe('useGetProductLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetProductLazyQuery).toBeDefined();
    expect(typeof useGetProductLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetProductLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetProductLazyQuery();
    const result2 = useGetProductLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetProductLazyQuery(null)).not.toThrow();
    expect(() => useGetProductLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetProductSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetProductSuspenseQuery).toBeDefined();
    expect(typeof useGetProductSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetProductSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetProductSuspenseQuery();
    const result2 = useGetProductSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetProductSuspenseQuery(null)).not.toThrow();
    expect(() => useGetProductSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('GetProductCategoriesDocument', () => {
  it('should be defined', () => {
    expect(GetProductCategoriesDocument).toBeDefined();
    expect(typeof GetProductCategoriesDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetProductCategoriesDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetProductCategoriesDocument();
    const result2 = GetProductCategoriesDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetProductCategoriesDocument(null)).not.toThrow();
    expect(() => GetProductCategoriesDocument(undefined)).not.toThrow();
  });
});


describe('useGetProductCategoriesQuery', () => {
  it('should be defined', () => {
    expect(useGetProductCategoriesQuery).toBeDefined();
    expect(typeof useGetProductCategoriesQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetProductCategoriesQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetProductCategoriesQuery();
    const result2 = useGetProductCategoriesQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetProductCategoriesQuery(null)).not.toThrow();
    expect(() => useGetProductCategoriesQuery(undefined)).not.toThrow();
  });
});


describe('useGetProductCategoriesLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetProductCategoriesLazyQuery).toBeDefined();
    expect(typeof useGetProductCategoriesLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetProductCategoriesLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetProductCategoriesLazyQuery();
    const result2 = useGetProductCategoriesLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetProductCategoriesLazyQuery(null)).not.toThrow();
    expect(() => useGetProductCategoriesLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetProductCategoriesSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetProductCategoriesSuspenseQuery).toBeDefined();
    expect(typeof useGetProductCategoriesSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetProductCategoriesSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetProductCategoriesSuspenseQuery();
    const result2 = useGetProductCategoriesSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetProductCategoriesSuspenseQuery(null)).not.toThrow();
    expect(() => useGetProductCategoriesSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('CreateProductDocument', () => {
  it('should be defined', () => {
    expect(CreateProductDocument).toBeDefined();
    expect(typeof CreateProductDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => CreateProductDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = CreateProductDocument();
    const result2 = CreateProductDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => CreateProductDocument(null)).not.toThrow();
    expect(() => CreateProductDocument(undefined)).not.toThrow();
  });
});


describe('useCreateProductMutation', () => {
  it('should be defined', () => {
    expect(useCreateProductMutation).toBeDefined();
    expect(typeof useCreateProductMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useCreateProductMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useCreateProductMutation();
    const result2 = useCreateProductMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useCreateProductMutation(null)).not.toThrow();
    expect(() => useCreateProductMutation(undefined)).not.toThrow();
  });
});


describe('UpdateProductDocument', () => {
  it('should be defined', () => {
    expect(UpdateProductDocument).toBeDefined();
    expect(typeof UpdateProductDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => UpdateProductDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = UpdateProductDocument();
    const result2 = UpdateProductDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => UpdateProductDocument(null)).not.toThrow();
    expect(() => UpdateProductDocument(undefined)).not.toThrow();
  });
});


describe('useUpdateProductMutation', () => {
  it('should be defined', () => {
    expect(useUpdateProductMutation).toBeDefined();
    expect(typeof useUpdateProductMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useUpdateProductMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useUpdateProductMutation();
    const result2 = useUpdateProductMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useUpdateProductMutation(null)).not.toThrow();
    expect(() => useUpdateProductMutation(undefined)).not.toThrow();
  });
});


describe('DeleteProductDocument', () => {
  it('should be defined', () => {
    expect(DeleteProductDocument).toBeDefined();
    expect(typeof DeleteProductDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => DeleteProductDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = DeleteProductDocument();
    const result2 = DeleteProductDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => DeleteProductDocument(null)).not.toThrow();
    expect(() => DeleteProductDocument(undefined)).not.toThrow();
  });
});


describe('useDeleteProductMutation', () => {
  it('should be defined', () => {
    expect(useDeleteProductMutation).toBeDefined();
    expect(typeof useDeleteProductMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useDeleteProductMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useDeleteProductMutation();
    const result2 = useDeleteProductMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useDeleteProductMutation(null)).not.toThrow();
    expect(() => useDeleteProductMutation(undefined)).not.toThrow();
  });
});


describe('GetOrdersDocument', () => {
  it('should be defined', () => {
    expect(GetOrdersDocument).toBeDefined();
    expect(typeof GetOrdersDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetOrdersDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetOrdersDocument();
    const result2 = GetOrdersDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetOrdersDocument(null)).not.toThrow();
    expect(() => GetOrdersDocument(undefined)).not.toThrow();
  });
});


describe('useGetOrdersQuery', () => {
  it('should be defined', () => {
    expect(useGetOrdersQuery).toBeDefined();
    expect(typeof useGetOrdersQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetOrdersQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetOrdersQuery();
    const result2 = useGetOrdersQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetOrdersQuery(null)).not.toThrow();
    expect(() => useGetOrdersQuery(undefined)).not.toThrow();
  });
});


describe('useGetOrdersLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetOrdersLazyQuery).toBeDefined();
    expect(typeof useGetOrdersLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetOrdersLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetOrdersLazyQuery();
    const result2 = useGetOrdersLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetOrdersLazyQuery(null)).not.toThrow();
    expect(() => useGetOrdersLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetOrdersSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetOrdersSuspenseQuery).toBeDefined();
    expect(typeof useGetOrdersSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetOrdersSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetOrdersSuspenseQuery();
    const result2 = useGetOrdersSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetOrdersSuspenseQuery(null)).not.toThrow();
    expect(() => useGetOrdersSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('GetOrderDocument', () => {
  it('should be defined', () => {
    expect(GetOrderDocument).toBeDefined();
    expect(typeof GetOrderDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetOrderDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetOrderDocument();
    const result2 = GetOrderDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetOrderDocument(null)).not.toThrow();
    expect(() => GetOrderDocument(undefined)).not.toThrow();
  });
});


describe('useGetOrderQuery', () => {
  it('should be defined', () => {
    expect(useGetOrderQuery).toBeDefined();
    expect(typeof useGetOrderQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetOrderQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetOrderQuery();
    const result2 = useGetOrderQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetOrderQuery(null)).not.toThrow();
    expect(() => useGetOrderQuery(undefined)).not.toThrow();
  });
});


describe('useGetOrderLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetOrderLazyQuery).toBeDefined();
    expect(typeof useGetOrderLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetOrderLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetOrderLazyQuery();
    const result2 = useGetOrderLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetOrderLazyQuery(null)).not.toThrow();
    expect(() => useGetOrderLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetOrderSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetOrderSuspenseQuery).toBeDefined();
    expect(typeof useGetOrderSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetOrderSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetOrderSuspenseQuery();
    const result2 = useGetOrderSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetOrderSuspenseQuery(null)).not.toThrow();
    expect(() => useGetOrderSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('CreateOrderDocument', () => {
  it('should be defined', () => {
    expect(CreateOrderDocument).toBeDefined();
    expect(typeof CreateOrderDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => CreateOrderDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = CreateOrderDocument();
    const result2 = CreateOrderDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => CreateOrderDocument(null)).not.toThrow();
    expect(() => CreateOrderDocument(undefined)).not.toThrow();
  });
});


describe('useCreateOrderMutation', () => {
  it('should be defined', () => {
    expect(useCreateOrderMutation).toBeDefined();
    expect(typeof useCreateOrderMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useCreateOrderMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useCreateOrderMutation();
    const result2 = useCreateOrderMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useCreateOrderMutation(null)).not.toThrow();
    expect(() => useCreateOrderMutation(undefined)).not.toThrow();
  });
});


describe('UpdateOrderStatusDocument', () => {
  it('should be defined', () => {
    expect(UpdateOrderStatusDocument).toBeDefined();
    expect(typeof UpdateOrderStatusDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => UpdateOrderStatusDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = UpdateOrderStatusDocument();
    const result2 = UpdateOrderStatusDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => UpdateOrderStatusDocument(null)).not.toThrow();
    expect(() => UpdateOrderStatusDocument(undefined)).not.toThrow();
  });
});


describe('useUpdateOrderStatusMutation', () => {
  it('should be defined', () => {
    expect(useUpdateOrderStatusMutation).toBeDefined();
    expect(typeof useUpdateOrderStatusMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useUpdateOrderStatusMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useUpdateOrderStatusMutation();
    const result2 = useUpdateOrderStatusMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useUpdateOrderStatusMutation(null)).not.toThrow();
    expect(() => useUpdateOrderStatusMutation(undefined)).not.toThrow();
  });
});


describe('GetPaymentsDocument', () => {
  it('should be defined', () => {
    expect(GetPaymentsDocument).toBeDefined();
    expect(typeof GetPaymentsDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetPaymentsDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetPaymentsDocument();
    const result2 = GetPaymentsDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetPaymentsDocument(null)).not.toThrow();
    expect(() => GetPaymentsDocument(undefined)).not.toThrow();
  });
});


describe('useGetPaymentsQuery', () => {
  it('should be defined', () => {
    expect(useGetPaymentsQuery).toBeDefined();
    expect(typeof useGetPaymentsQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetPaymentsQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetPaymentsQuery();
    const result2 = useGetPaymentsQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetPaymentsQuery(null)).not.toThrow();
    expect(() => useGetPaymentsQuery(undefined)).not.toThrow();
  });
});


describe('useGetPaymentsLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetPaymentsLazyQuery).toBeDefined();
    expect(typeof useGetPaymentsLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetPaymentsLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetPaymentsLazyQuery();
    const result2 = useGetPaymentsLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetPaymentsLazyQuery(null)).not.toThrow();
    expect(() => useGetPaymentsLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetPaymentsSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetPaymentsSuspenseQuery).toBeDefined();
    expect(typeof useGetPaymentsSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetPaymentsSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetPaymentsSuspenseQuery();
    const result2 = useGetPaymentsSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetPaymentsSuspenseQuery(null)).not.toThrow();
    expect(() => useGetPaymentsSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('GetPaymentDocument', () => {
  it('should be defined', () => {
    expect(GetPaymentDocument).toBeDefined();
    expect(typeof GetPaymentDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetPaymentDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetPaymentDocument();
    const result2 = GetPaymentDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetPaymentDocument(null)).not.toThrow();
    expect(() => GetPaymentDocument(undefined)).not.toThrow();
  });
});


describe('useGetPaymentQuery', () => {
  it('should be defined', () => {
    expect(useGetPaymentQuery).toBeDefined();
    expect(typeof useGetPaymentQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetPaymentQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetPaymentQuery();
    const result2 = useGetPaymentQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetPaymentQuery(null)).not.toThrow();
    expect(() => useGetPaymentQuery(undefined)).not.toThrow();
  });
});


describe('useGetPaymentLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetPaymentLazyQuery).toBeDefined();
    expect(typeof useGetPaymentLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetPaymentLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetPaymentLazyQuery();
    const result2 = useGetPaymentLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetPaymentLazyQuery(null)).not.toThrow();
    expect(() => useGetPaymentLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetPaymentSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetPaymentSuspenseQuery).toBeDefined();
    expect(typeof useGetPaymentSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetPaymentSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetPaymentSuspenseQuery();
    const result2 = useGetPaymentSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetPaymentSuspenseQuery(null)).not.toThrow();
    expect(() => useGetPaymentSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('CreatePaymentDocument', () => {
  it('should be defined', () => {
    expect(CreatePaymentDocument).toBeDefined();
    expect(typeof CreatePaymentDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => CreatePaymentDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = CreatePaymentDocument();
    const result2 = CreatePaymentDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => CreatePaymentDocument(null)).not.toThrow();
    expect(() => CreatePaymentDocument(undefined)).not.toThrow();
  });
});


describe('useCreatePaymentMutation', () => {
  it('should be defined', () => {
    expect(useCreatePaymentMutation).toBeDefined();
    expect(typeof useCreatePaymentMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useCreatePaymentMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useCreatePaymentMutation();
    const result2 = useCreatePaymentMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useCreatePaymentMutation(null)).not.toThrow();
    expect(() => useCreatePaymentMutation(undefined)).not.toThrow();
  });
});


describe('ProcessPaymentDocument', () => {
  it('should be defined', () => {
    expect(ProcessPaymentDocument).toBeDefined();
    expect(typeof ProcessPaymentDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => ProcessPaymentDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = ProcessPaymentDocument();
    const result2 = ProcessPaymentDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => ProcessPaymentDocument(null)).not.toThrow();
    expect(() => ProcessPaymentDocument(undefined)).not.toThrow();
  });
});


describe('useProcessPaymentMutation', () => {
  it('should be defined', () => {
    expect(useProcessPaymentMutation).toBeDefined();
    expect(typeof useProcessPaymentMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useProcessPaymentMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useProcessPaymentMutation();
    const result2 = useProcessPaymentMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useProcessPaymentMutation(null)).not.toThrow();
    expect(() => useProcessPaymentMutation(undefined)).not.toThrow();
  });
});


describe('GetProductStocksDocument', () => {
  it('should be defined', () => {
    expect(GetProductStocksDocument).toBeDefined();
    expect(typeof GetProductStocksDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetProductStocksDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetProductStocksDocument();
    const result2 = GetProductStocksDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetProductStocksDocument(null)).not.toThrow();
    expect(() => GetProductStocksDocument(undefined)).not.toThrow();
  });
});


describe('useGetProductStocksQuery', () => {
  it('should be defined', () => {
    expect(useGetProductStocksQuery).toBeDefined();
    expect(typeof useGetProductStocksQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetProductStocksQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetProductStocksQuery();
    const result2 = useGetProductStocksQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetProductStocksQuery(null)).not.toThrow();
    expect(() => useGetProductStocksQuery(undefined)).not.toThrow();
  });
});


describe('useGetProductStocksLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetProductStocksLazyQuery).toBeDefined();
    expect(typeof useGetProductStocksLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetProductStocksLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetProductStocksLazyQuery();
    const result2 = useGetProductStocksLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetProductStocksLazyQuery(null)).not.toThrow();
    expect(() => useGetProductStocksLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetProductStocksSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetProductStocksSuspenseQuery).toBeDefined();
    expect(typeof useGetProductStocksSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetProductStocksSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetProductStocksSuspenseQuery();
    const result2 = useGetProductStocksSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetProductStocksSuspenseQuery(null)).not.toThrow();
    expect(() => useGetProductStocksSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('GetStockSizesDocument', () => {
  it('should be defined', () => {
    expect(GetStockSizesDocument).toBeDefined();
    expect(typeof GetStockSizesDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetStockSizesDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetStockSizesDocument();
    const result2 = GetStockSizesDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetStockSizesDocument(null)).not.toThrow();
    expect(() => GetStockSizesDocument(undefined)).not.toThrow();
  });
});


describe('useGetStockSizesQuery', () => {
  it('should be defined', () => {
    expect(useGetStockSizesQuery).toBeDefined();
    expect(typeof useGetStockSizesQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetStockSizesQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetStockSizesQuery();
    const result2 = useGetStockSizesQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetStockSizesQuery(null)).not.toThrow();
    expect(() => useGetStockSizesQuery(undefined)).not.toThrow();
  });
});


describe('useGetStockSizesLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetStockSizesLazyQuery).toBeDefined();
    expect(typeof useGetStockSizesLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetStockSizesLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetStockSizesLazyQuery();
    const result2 = useGetStockSizesLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetStockSizesLazyQuery(null)).not.toThrow();
    expect(() => useGetStockSizesLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetStockSizesSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetStockSizesSuspenseQuery).toBeDefined();
    expect(typeof useGetStockSizesSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetStockSizesSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetStockSizesSuspenseQuery();
    const result2 = useGetStockSizesSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetStockSizesSuspenseQuery(null)).not.toThrow();
    expect(() => useGetStockSizesSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('CreatePaymentIntentForOrderDocument', () => {
  it('should be defined', () => {
    expect(CreatePaymentIntentForOrderDocument).toBeDefined();
    expect(typeof CreatePaymentIntentForOrderDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => CreatePaymentIntentForOrderDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = CreatePaymentIntentForOrderDocument();
    const result2 = CreatePaymentIntentForOrderDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => CreatePaymentIntentForOrderDocument(null)).not.toThrow();
    expect(() => CreatePaymentIntentForOrderDocument(undefined)).not.toThrow();
  });
});


describe('useCreatePaymentIntentForOrderMutation', () => {
  it('should be defined', () => {
    expect(useCreatePaymentIntentForOrderMutation).toBeDefined();
    expect(typeof useCreatePaymentIntentForOrderMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useCreatePaymentIntentForOrderMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useCreatePaymentIntentForOrderMutation();
    const result2 = useCreatePaymentIntentForOrderMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useCreatePaymentIntentForOrderMutation(null)).not.toThrow();
    expect(() => useCreatePaymentIntentForOrderMutation(undefined)).not.toThrow();
  });
});


describe('ConfirmOrderPaymentDocument', () => {
  it('should be defined', () => {
    expect(ConfirmOrderPaymentDocument).toBeDefined();
    expect(typeof ConfirmOrderPaymentDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => ConfirmOrderPaymentDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = ConfirmOrderPaymentDocument();
    const result2 = ConfirmOrderPaymentDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => ConfirmOrderPaymentDocument(null)).not.toThrow();
    expect(() => ConfirmOrderPaymentDocument(undefined)).not.toThrow();
  });
});


describe('useConfirmOrderPaymentMutation', () => {
  it('should be defined', () => {
    expect(useConfirmOrderPaymentMutation).toBeDefined();
    expect(typeof useConfirmOrderPaymentMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useConfirmOrderPaymentMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useConfirmOrderPaymentMutation();
    const result2 = useConfirmOrderPaymentMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useConfirmOrderPaymentMutation(null)).not.toThrow();
    expect(() => useConfirmOrderPaymentMutation(undefined)).not.toThrow();
  });
});


describe('AttendanceStatsDocument', () => {
  it('should be defined', () => {
    expect(AttendanceStatsDocument).toBeDefined();
    expect(typeof AttendanceStatsDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => AttendanceStatsDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = AttendanceStatsDocument();
    const result2 = AttendanceStatsDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => AttendanceStatsDocument(null)).not.toThrow();
    expect(() => AttendanceStatsDocument(undefined)).not.toThrow();
  });
});


describe('useAttendanceStatsQuery', () => {
  it('should be defined', () => {
    expect(useAttendanceStatsQuery).toBeDefined();
    expect(typeof useAttendanceStatsQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useAttendanceStatsQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useAttendanceStatsQuery();
    const result2 = useAttendanceStatsQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useAttendanceStatsQuery(null)).not.toThrow();
    expect(() => useAttendanceStatsQuery(undefined)).not.toThrow();
  });
});


describe('useAttendanceStatsLazyQuery', () => {
  it('should be defined', () => {
    expect(useAttendanceStatsLazyQuery).toBeDefined();
    expect(typeof useAttendanceStatsLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useAttendanceStatsLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useAttendanceStatsLazyQuery();
    const result2 = useAttendanceStatsLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useAttendanceStatsLazyQuery(null)).not.toThrow();
    expect(() => useAttendanceStatsLazyQuery(undefined)).not.toThrow();
  });
});


describe('useAttendanceStatsSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useAttendanceStatsSuspenseQuery).toBeDefined();
    expect(typeof useAttendanceStatsSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useAttendanceStatsSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useAttendanceStatsSuspenseQuery();
    const result2 = useAttendanceStatsSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useAttendanceStatsSuspenseQuery(null)).not.toThrow();
    expect(() => useAttendanceStatsSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('TopMembersDocument', () => {
  it('should be defined', () => {
    expect(TopMembersDocument).toBeDefined();
    expect(typeof TopMembersDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => TopMembersDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = TopMembersDocument();
    const result2 = TopMembersDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => TopMembersDocument(null)).not.toThrow();
    expect(() => TopMembersDocument(undefined)).not.toThrow();
  });
});


describe('useTopMembersQuery', () => {
  it('should be defined', () => {
    expect(useTopMembersQuery).toBeDefined();
    expect(typeof useTopMembersQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useTopMembersQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useTopMembersQuery();
    const result2 = useTopMembersQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useTopMembersQuery(null)).not.toThrow();
    expect(() => useTopMembersQuery(undefined)).not.toThrow();
  });
});


describe('useTopMembersLazyQuery', () => {
  it('should be defined', () => {
    expect(useTopMembersLazyQuery).toBeDefined();
    expect(typeof useTopMembersLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useTopMembersLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useTopMembersLazyQuery();
    const result2 = useTopMembersLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useTopMembersLazyQuery(null)).not.toThrow();
    expect(() => useTopMembersLazyQuery(undefined)).not.toThrow();
  });
});


describe('useTopMembersSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useTopMembersSuspenseQuery).toBeDefined();
    expect(typeof useTopMembersSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useTopMembersSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useTopMembersSuspenseQuery();
    const result2 = useTopMembersSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useTopMembersSuspenseQuery(null)).not.toThrow();
    expect(() => useTopMembersSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('MembersCountDocument', () => {
  it('should be defined', () => {
    expect(MembersCountDocument).toBeDefined();
    expect(typeof MembersCountDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => MembersCountDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = MembersCountDocument();
    const result2 = MembersCountDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => MembersCountDocument(null)).not.toThrow();
    expect(() => MembersCountDocument(undefined)).not.toThrow();
  });
});


describe('useMembersCountQuery', () => {
  it('should be defined', () => {
    expect(useMembersCountQuery).toBeDefined();
    expect(typeof useMembersCountQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMembersCountQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMembersCountQuery();
    const result2 = useMembersCountQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMembersCountQuery(null)).not.toThrow();
    expect(() => useMembersCountQuery(undefined)).not.toThrow();
  });
});


describe('useMembersCountLazyQuery', () => {
  it('should be defined', () => {
    expect(useMembersCountLazyQuery).toBeDefined();
    expect(typeof useMembersCountLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMembersCountLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMembersCountLazyQuery();
    const result2 = useMembersCountLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMembersCountLazyQuery(null)).not.toThrow();
    expect(() => useMembersCountLazyQuery(undefined)).not.toThrow();
  });
});


describe('useMembersCountSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useMembersCountSuspenseQuery).toBeDefined();
    expect(typeof useMembersCountSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMembersCountSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMembersCountSuspenseQuery();
    const result2 = useMembersCountSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMembersCountSuspenseQuery(null)).not.toThrow();
    expect(() => useMembersCountSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('MembersByGradeDocument', () => {
  it('should be defined', () => {
    expect(MembersByGradeDocument).toBeDefined();
    expect(typeof MembersByGradeDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => MembersByGradeDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = MembersByGradeDocument();
    const result2 = MembersByGradeDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => MembersByGradeDocument(null)).not.toThrow();
    expect(() => MembersByGradeDocument(undefined)).not.toThrow();
  });
});


describe('useMembersByGradeQuery', () => {
  it('should be defined', () => {
    expect(useMembersByGradeQuery).toBeDefined();
    expect(typeof useMembersByGradeQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMembersByGradeQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMembersByGradeQuery();
    const result2 = useMembersByGradeQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMembersByGradeQuery(null)).not.toThrow();
    expect(() => useMembersByGradeQuery(undefined)).not.toThrow();
  });
});


describe('useMembersByGradeLazyQuery', () => {
  it('should be defined', () => {
    expect(useMembersByGradeLazyQuery).toBeDefined();
    expect(typeof useMembersByGradeLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMembersByGradeLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMembersByGradeLazyQuery();
    const result2 = useMembersByGradeLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMembersByGradeLazyQuery(null)).not.toThrow();
    expect(() => useMembersByGradeLazyQuery(undefined)).not.toThrow();
  });
});


describe('useMembersByGradeSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useMembersByGradeSuspenseQuery).toBeDefined();
    expect(typeof useMembersByGradeSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMembersByGradeSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMembersByGradeSuspenseQuery();
    const result2 = useMembersByGradeSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMembersByGradeSuspenseQuery(null)).not.toThrow();
    expect(() => useMembersByGradeSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('MembersByGenderDocument', () => {
  it('should be defined', () => {
    expect(MembersByGenderDocument).toBeDefined();
    expect(typeof MembersByGenderDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => MembersByGenderDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = MembersByGenderDocument();
    const result2 = MembersByGenderDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => MembersByGenderDocument(null)).not.toThrow();
    expect(() => MembersByGenderDocument(undefined)).not.toThrow();
  });
});


describe('useMembersByGenderQuery', () => {
  it('should be defined', () => {
    expect(useMembersByGenderQuery).toBeDefined();
    expect(typeof useMembersByGenderQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMembersByGenderQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMembersByGenderQuery();
    const result2 = useMembersByGenderQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMembersByGenderQuery(null)).not.toThrow();
    expect(() => useMembersByGenderQuery(undefined)).not.toThrow();
  });
});


describe('useMembersByGenderLazyQuery', () => {
  it('should be defined', () => {
    expect(useMembersByGenderLazyQuery).toBeDefined();
    expect(typeof useMembersByGenderLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMembersByGenderLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMembersByGenderLazyQuery();
    const result2 = useMembersByGenderLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMembersByGenderLazyQuery(null)).not.toThrow();
    expect(() => useMembersByGenderLazyQuery(undefined)).not.toThrow();
  });
});


describe('useMembersByGenderSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useMembersByGenderSuspenseQuery).toBeDefined();
    expect(typeof useMembersByGenderSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMembersByGenderSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMembersByGenderSuspenseQuery();
    const result2 = useMembersByGenderSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMembersByGenderSuspenseQuery(null)).not.toThrow();
    expect(() => useMembersByGenderSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('BirthdaysDocument', () => {
  it('should be defined', () => {
    expect(BirthdaysDocument).toBeDefined();
    expect(typeof BirthdaysDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => BirthdaysDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = BirthdaysDocument();
    const result2 = BirthdaysDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => BirthdaysDocument(null)).not.toThrow();
    expect(() => BirthdaysDocument(undefined)).not.toThrow();
  });
});


describe('useBirthdaysQuery', () => {
  it('should be defined', () => {
    expect(useBirthdaysQuery).toBeDefined();
    expect(typeof useBirthdaysQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useBirthdaysQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useBirthdaysQuery();
    const result2 = useBirthdaysQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useBirthdaysQuery(null)).not.toThrow();
    expect(() => useBirthdaysQuery(undefined)).not.toThrow();
  });
});


describe('useBirthdaysLazyQuery', () => {
  it('should be defined', () => {
    expect(useBirthdaysLazyQuery).toBeDefined();
    expect(typeof useBirthdaysLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useBirthdaysLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useBirthdaysLazyQuery();
    const result2 = useBirthdaysLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useBirthdaysLazyQuery(null)).not.toThrow();
    expect(() => useBirthdaysLazyQuery(undefined)).not.toThrow();
  });
});


describe('useBirthdaysSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useBirthdaysSuspenseQuery).toBeDefined();
    expect(typeof useBirthdaysSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useBirthdaysSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useBirthdaysSuspenseQuery();
    const result2 = useBirthdaysSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useBirthdaysSuspenseQuery(null)).not.toThrow();
    expect(() => useBirthdaysSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('NewMembersDocument', () => {
  it('should be defined', () => {
    expect(NewMembersDocument).toBeDefined();
    expect(typeof NewMembersDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => NewMembersDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = NewMembersDocument();
    const result2 = NewMembersDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => NewMembersDocument(null)).not.toThrow();
    expect(() => NewMembersDocument(undefined)).not.toThrow();
  });
});


describe('useNewMembersQuery', () => {
  it('should be defined', () => {
    expect(useNewMembersQuery).toBeDefined();
    expect(typeof useNewMembersQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useNewMembersQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useNewMembersQuery();
    const result2 = useNewMembersQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useNewMembersQuery(null)).not.toThrow();
    expect(() => useNewMembersQuery(undefined)).not.toThrow();
  });
});


describe('useNewMembersLazyQuery', () => {
  it('should be defined', () => {
    expect(useNewMembersLazyQuery).toBeDefined();
    expect(typeof useNewMembersLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useNewMembersLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useNewMembersLazyQuery();
    const result2 = useNewMembersLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useNewMembersLazyQuery(null)).not.toThrow();
    expect(() => useNewMembersLazyQuery(undefined)).not.toThrow();
  });
});


describe('useNewMembersSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useNewMembersSuspenseQuery).toBeDefined();
    expect(typeof useNewMembersSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useNewMembersSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useNewMembersSuspenseQuery();
    const result2 = useNewMembersSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useNewMembersSuspenseQuery(null)).not.toThrow();
    expect(() => useNewMembersSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('TopProductsDocument', () => {
  it('should be defined', () => {
    expect(TopProductsDocument).toBeDefined();
    expect(typeof TopProductsDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => TopProductsDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = TopProductsDocument();
    const result2 = TopProductsDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => TopProductsDocument(null)).not.toThrow();
    expect(() => TopProductsDocument(undefined)).not.toThrow();
  });
});


describe('useTopProductsQuery', () => {
  it('should be defined', () => {
    expect(useTopProductsQuery).toBeDefined();
    expect(typeof useTopProductsQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useTopProductsQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useTopProductsQuery();
    const result2 = useTopProductsQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useTopProductsQuery(null)).not.toThrow();
    expect(() => useTopProductsQuery(undefined)).not.toThrow();
  });
});


describe('useTopProductsLazyQuery', () => {
  it('should be defined', () => {
    expect(useTopProductsLazyQuery).toBeDefined();
    expect(typeof useTopProductsLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useTopProductsLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useTopProductsLazyQuery();
    const result2 = useTopProductsLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useTopProductsLazyQuery(null)).not.toThrow();
    expect(() => useTopProductsLazyQuery(undefined)).not.toThrow();
  });
});


describe('useTopProductsSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useTopProductsSuspenseQuery).toBeDefined();
    expect(typeof useTopProductsSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useTopProductsSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useTopProductsSuspenseQuery();
    const result2 = useTopProductsSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useTopProductsSuspenseQuery(null)).not.toThrow();
    expect(() => useTopProductsSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('WeeklySessionsDocument', () => {
  it('should be defined', () => {
    expect(WeeklySessionsDocument).toBeDefined();
    expect(typeof WeeklySessionsDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => WeeklySessionsDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = WeeklySessionsDocument();
    const result2 = WeeklySessionsDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => WeeklySessionsDocument(null)).not.toThrow();
    expect(() => WeeklySessionsDocument(undefined)).not.toThrow();
  });
});


describe('useWeeklySessionsQuery', () => {
  it('should be defined', () => {
    expect(useWeeklySessionsQuery).toBeDefined();
    expect(typeof useWeeklySessionsQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useWeeklySessionsQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useWeeklySessionsQuery();
    const result2 = useWeeklySessionsQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useWeeklySessionsQuery(null)).not.toThrow();
    expect(() => useWeeklySessionsQuery(undefined)).not.toThrow();
  });
});


describe('useWeeklySessionsLazyQuery', () => {
  it('should be defined', () => {
    expect(useWeeklySessionsLazyQuery).toBeDefined();
    expect(typeof useWeeklySessionsLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useWeeklySessionsLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useWeeklySessionsLazyQuery();
    const result2 = useWeeklySessionsLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useWeeklySessionsLazyQuery(null)).not.toThrow();
    expect(() => useWeeklySessionsLazyQuery(undefined)).not.toThrow();
  });
});


describe('useWeeklySessionsSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useWeeklySessionsSuspenseQuery).toBeDefined();
    expect(typeof useWeeklySessionsSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useWeeklySessionsSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useWeeklySessionsSuspenseQuery();
    const result2 = useWeeklySessionsSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useWeeklySessionsSuspenseQuery(null)).not.toThrow();
    expect(() => useWeeklySessionsSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('MonthlyPaymentsDocument', () => {
  it('should be defined', () => {
    expect(MonthlyPaymentsDocument).toBeDefined();
    expect(typeof MonthlyPaymentsDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => MonthlyPaymentsDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = MonthlyPaymentsDocument();
    const result2 = MonthlyPaymentsDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => MonthlyPaymentsDocument(null)).not.toThrow();
    expect(() => MonthlyPaymentsDocument(undefined)).not.toThrow();
  });
});


describe('useMonthlyPaymentsQuery', () => {
  it('should be defined', () => {
    expect(useMonthlyPaymentsQuery).toBeDefined();
    expect(typeof useMonthlyPaymentsQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMonthlyPaymentsQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMonthlyPaymentsQuery();
    const result2 = useMonthlyPaymentsQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMonthlyPaymentsQuery(null)).not.toThrow();
    expect(() => useMonthlyPaymentsQuery(undefined)).not.toThrow();
  });
});


describe('useMonthlyPaymentsLazyQuery', () => {
  it('should be defined', () => {
    expect(useMonthlyPaymentsLazyQuery).toBeDefined();
    expect(typeof useMonthlyPaymentsLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMonthlyPaymentsLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMonthlyPaymentsLazyQuery();
    const result2 = useMonthlyPaymentsLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMonthlyPaymentsLazyQuery(null)).not.toThrow();
    expect(() => useMonthlyPaymentsLazyQuery(undefined)).not.toThrow();
  });
});


describe('useMonthlyPaymentsSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useMonthlyPaymentsSuspenseQuery).toBeDefined();
    expect(typeof useMonthlyPaymentsSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMonthlyPaymentsSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMonthlyPaymentsSuspenseQuery();
    const result2 = useMonthlyPaymentsSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMonthlyPaymentsSuspenseQuery(null)).not.toThrow();
    expect(() => useMonthlyPaymentsSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('RecentPaymentsDocument', () => {
  it('should be defined', () => {
    expect(RecentPaymentsDocument).toBeDefined();
    expect(typeof RecentPaymentsDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => RecentPaymentsDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = RecentPaymentsDocument();
    const result2 = RecentPaymentsDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => RecentPaymentsDocument(null)).not.toThrow();
    expect(() => RecentPaymentsDocument(undefined)).not.toThrow();
  });
});


describe('useRecentPaymentsQuery', () => {
  it('should be defined', () => {
    expect(useRecentPaymentsQuery).toBeDefined();
    expect(typeof useRecentPaymentsQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useRecentPaymentsQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useRecentPaymentsQuery();
    const result2 = useRecentPaymentsQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useRecentPaymentsQuery(null)).not.toThrow();
    expect(() => useRecentPaymentsQuery(undefined)).not.toThrow();
  });
});


describe('useRecentPaymentsLazyQuery', () => {
  it('should be defined', () => {
    expect(useRecentPaymentsLazyQuery).toBeDefined();
    expect(typeof useRecentPaymentsLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useRecentPaymentsLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useRecentPaymentsLazyQuery();
    const result2 = useRecentPaymentsLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useRecentPaymentsLazyQuery(null)).not.toThrow();
    expect(() => useRecentPaymentsLazyQuery(undefined)).not.toThrow();
  });
});


describe('useRecentPaymentsSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useRecentPaymentsSuspenseQuery).toBeDefined();
    expect(typeof useRecentPaymentsSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useRecentPaymentsSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useRecentPaymentsSuspenseQuery();
    const result2 = useRecentPaymentsSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useRecentPaymentsSuspenseQuery(null)).not.toThrow();
    expect(() => useRecentPaymentsSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('PendingPaymentsDocument', () => {
  it('should be defined', () => {
    expect(PendingPaymentsDocument).toBeDefined();
    expect(typeof PendingPaymentsDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => PendingPaymentsDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = PendingPaymentsDocument();
    const result2 = PendingPaymentsDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => PendingPaymentsDocument(null)).not.toThrow();
    expect(() => PendingPaymentsDocument(undefined)).not.toThrow();
  });
});


describe('usePendingPaymentsQuery', () => {
  it('should be defined', () => {
    expect(usePendingPaymentsQuery).toBeDefined();
    expect(typeof usePendingPaymentsQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => usePendingPaymentsQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = usePendingPaymentsQuery();
    const result2 = usePendingPaymentsQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => usePendingPaymentsQuery(null)).not.toThrow();
    expect(() => usePendingPaymentsQuery(undefined)).not.toThrow();
  });
});


describe('usePendingPaymentsLazyQuery', () => {
  it('should be defined', () => {
    expect(usePendingPaymentsLazyQuery).toBeDefined();
    expect(typeof usePendingPaymentsLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => usePendingPaymentsLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = usePendingPaymentsLazyQuery();
    const result2 = usePendingPaymentsLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => usePendingPaymentsLazyQuery(null)).not.toThrow();
    expect(() => usePendingPaymentsLazyQuery(undefined)).not.toThrow();
  });
});


describe('usePendingPaymentsSuspenseQuery', () => {
  it('should be defined', () => {
    expect(usePendingPaymentsSuspenseQuery).toBeDefined();
    expect(typeof usePendingPaymentsSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => usePendingPaymentsSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = usePendingPaymentsSuspenseQuery();
    const result2 = usePendingPaymentsSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => usePendingPaymentsSuspenseQuery(null)).not.toThrow();
    expect(() => usePendingPaymentsSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('OverduePaymentsDocument', () => {
  it('should be defined', () => {
    expect(OverduePaymentsDocument).toBeDefined();
    expect(typeof OverduePaymentsDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => OverduePaymentsDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = OverduePaymentsDocument();
    const result2 = OverduePaymentsDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => OverduePaymentsDocument(null)).not.toThrow();
    expect(() => OverduePaymentsDocument(undefined)).not.toThrow();
  });
});


describe('useOverduePaymentsQuery', () => {
  it('should be defined', () => {
    expect(useOverduePaymentsQuery).toBeDefined();
    expect(typeof useOverduePaymentsQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useOverduePaymentsQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useOverduePaymentsQuery();
    const result2 = useOverduePaymentsQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useOverduePaymentsQuery(null)).not.toThrow();
    expect(() => useOverduePaymentsQuery(undefined)).not.toThrow();
  });
});


describe('useOverduePaymentsLazyQuery', () => {
  it('should be defined', () => {
    expect(useOverduePaymentsLazyQuery).toBeDefined();
    expect(typeof useOverduePaymentsLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useOverduePaymentsLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useOverduePaymentsLazyQuery();
    const result2 = useOverduePaymentsLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useOverduePaymentsLazyQuery(null)).not.toThrow();
    expect(() => useOverduePaymentsLazyQuery(undefined)).not.toThrow();
  });
});


describe('useOverduePaymentsSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useOverduePaymentsSuspenseQuery).toBeDefined();
    expect(typeof useOverduePaymentsSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useOverduePaymentsSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useOverduePaymentsSuspenseQuery();
    const result2 = useOverduePaymentsSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useOverduePaymentsSuspenseQuery(null)).not.toThrow();
    expect(() => useOverduePaymentsSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('LastPaymentsDocument', () => {
  it('should be defined', () => {
    expect(LastPaymentsDocument).toBeDefined();
    expect(typeof LastPaymentsDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => LastPaymentsDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = LastPaymentsDocument();
    const result2 = LastPaymentsDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => LastPaymentsDocument(null)).not.toThrow();
    expect(() => LastPaymentsDocument(undefined)).not.toThrow();
  });
});


describe('useLastPaymentsQuery', () => {
  it('should be defined', () => {
    expect(useLastPaymentsQuery).toBeDefined();
    expect(typeof useLastPaymentsQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useLastPaymentsQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useLastPaymentsQuery();
    const result2 = useLastPaymentsQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useLastPaymentsQuery(null)).not.toThrow();
    expect(() => useLastPaymentsQuery(undefined)).not.toThrow();
  });
});


describe('useLastPaymentsLazyQuery', () => {
  it('should be defined', () => {
    expect(useLastPaymentsLazyQuery).toBeDefined();
    expect(typeof useLastPaymentsLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useLastPaymentsLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useLastPaymentsLazyQuery();
    const result2 = useLastPaymentsLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useLastPaymentsLazyQuery(null)).not.toThrow();
    expect(() => useLastPaymentsLazyQuery(undefined)).not.toThrow();
  });
});


describe('useLastPaymentsSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useLastPaymentsSuspenseQuery).toBeDefined();
    expect(typeof useLastPaymentsSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useLastPaymentsSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useLastPaymentsSuspenseQuery();
    const result2 = useLastPaymentsSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useLastPaymentsSuspenseQuery(null)).not.toThrow();
    expect(() => useLastPaymentsSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('PaymentsByMonthDocument', () => {
  it('should be defined', () => {
    expect(PaymentsByMonthDocument).toBeDefined();
    expect(typeof PaymentsByMonthDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => PaymentsByMonthDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = PaymentsByMonthDocument();
    const result2 = PaymentsByMonthDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => PaymentsByMonthDocument(null)).not.toThrow();
    expect(() => PaymentsByMonthDocument(undefined)).not.toThrow();
  });
});


describe('usePaymentsByMonthQuery', () => {
  it('should be defined', () => {
    expect(usePaymentsByMonthQuery).toBeDefined();
    expect(typeof usePaymentsByMonthQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => usePaymentsByMonthQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = usePaymentsByMonthQuery();
    const result2 = usePaymentsByMonthQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => usePaymentsByMonthQuery(null)).not.toThrow();
    expect(() => usePaymentsByMonthQuery(undefined)).not.toThrow();
  });
});


describe('usePaymentsByMonthLazyQuery', () => {
  it('should be defined', () => {
    expect(usePaymentsByMonthLazyQuery).toBeDefined();
    expect(typeof usePaymentsByMonthLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => usePaymentsByMonthLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = usePaymentsByMonthLazyQuery();
    const result2 = usePaymentsByMonthLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => usePaymentsByMonthLazyQuery(null)).not.toThrow();
    expect(() => usePaymentsByMonthLazyQuery(undefined)).not.toThrow();
  });
});


describe('usePaymentsByMonthSuspenseQuery', () => {
  it('should be defined', () => {
    expect(usePaymentsByMonthSuspenseQuery).toBeDefined();
    expect(typeof usePaymentsByMonthSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => usePaymentsByMonthSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = usePaymentsByMonthSuspenseQuery();
    const result2 = usePaymentsByMonthSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => usePaymentsByMonthSuspenseQuery(null)).not.toThrow();
    expect(() => usePaymentsByMonthSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('ActivePlansDocument', () => {
  it('should be defined', () => {
    expect(ActivePlansDocument).toBeDefined();
    expect(typeof ActivePlansDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => ActivePlansDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = ActivePlansDocument();
    const result2 = ActivePlansDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => ActivePlansDocument(null)).not.toThrow();
    expect(() => ActivePlansDocument(undefined)).not.toThrow();
  });
});


describe('useActivePlansQuery', () => {
  it('should be defined', () => {
    expect(useActivePlansQuery).toBeDefined();
    expect(typeof useActivePlansQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useActivePlansQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useActivePlansQuery();
    const result2 = useActivePlansQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useActivePlansQuery(null)).not.toThrow();
    expect(() => useActivePlansQuery(undefined)).not.toThrow();
  });
});


describe('useActivePlansLazyQuery', () => {
  it('should be defined', () => {
    expect(useActivePlansLazyQuery).toBeDefined();
    expect(typeof useActivePlansLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useActivePlansLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useActivePlansLazyQuery();
    const result2 = useActivePlansLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useActivePlansLazyQuery(null)).not.toThrow();
    expect(() => useActivePlansLazyQuery(undefined)).not.toThrow();
  });
});


describe('useActivePlansSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useActivePlansSuspenseQuery).toBeDefined();
    expect(typeof useActivePlansSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useActivePlansSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useActivePlansSuspenseQuery();
    const result2 = useActivePlansSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useActivePlansSuspenseQuery(null)).not.toThrow();
    expect(() => useActivePlansSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('RenewalRateDocument', () => {
  it('should be defined', () => {
    expect(RenewalRateDocument).toBeDefined();
    expect(typeof RenewalRateDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => RenewalRateDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = RenewalRateDocument();
    const result2 = RenewalRateDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => RenewalRateDocument(null)).not.toThrow();
    expect(() => RenewalRateDocument(undefined)).not.toThrow();
  });
});


describe('useRenewalRateQuery', () => {
  it('should be defined', () => {
    expect(useRenewalRateQuery).toBeDefined();
    expect(typeof useRenewalRateQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useRenewalRateQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useRenewalRateQuery();
    const result2 = useRenewalRateQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useRenewalRateQuery(null)).not.toThrow();
    expect(() => useRenewalRateQuery(undefined)).not.toThrow();
  });
});


describe('useRenewalRateLazyQuery', () => {
  it('should be defined', () => {
    expect(useRenewalRateLazyQuery).toBeDefined();
    expect(typeof useRenewalRateLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useRenewalRateLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useRenewalRateLazyQuery();
    const result2 = useRenewalRateLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useRenewalRateLazyQuery(null)).not.toThrow();
    expect(() => useRenewalRateLazyQuery(undefined)).not.toThrow();
  });
});


describe('useRenewalRateSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useRenewalRateSuspenseQuery).toBeDefined();
    expect(typeof useRenewalRateSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useRenewalRateSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useRenewalRateSuspenseQuery();
    const result2 = useRenewalRateSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useRenewalRateSuspenseQuery(null)).not.toThrow();
    expect(() => useRenewalRateSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('MembersByPlanDocument', () => {
  it('should be defined', () => {
    expect(MembersByPlanDocument).toBeDefined();
    expect(typeof MembersByPlanDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => MembersByPlanDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = MembersByPlanDocument();
    const result2 = MembersByPlanDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => MembersByPlanDocument(null)).not.toThrow();
    expect(() => MembersByPlanDocument(undefined)).not.toThrow();
  });
});


describe('useMembersByPlanQuery', () => {
  it('should be defined', () => {
    expect(useMembersByPlanQuery).toBeDefined();
    expect(typeof useMembersByPlanQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMembersByPlanQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMembersByPlanQuery();
    const result2 = useMembersByPlanQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMembersByPlanQuery(null)).not.toThrow();
    expect(() => useMembersByPlanQuery(undefined)).not.toThrow();
  });
});


describe('useMembersByPlanLazyQuery', () => {
  it('should be defined', () => {
    expect(useMembersByPlanLazyQuery).toBeDefined();
    expect(typeof useMembersByPlanLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMembersByPlanLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMembersByPlanLazyQuery();
    const result2 = useMembersByPlanLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMembersByPlanLazyQuery(null)).not.toThrow();
    expect(() => useMembersByPlanLazyQuery(undefined)).not.toThrow();
  });
});


describe('useMembersByPlanSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useMembersByPlanSuspenseQuery).toBeDefined();
    expect(typeof useMembersByPlanSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useMembersByPlanSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useMembersByPlanSuspenseQuery();
    const result2 = useMembersByPlanSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useMembersByPlanSuspenseQuery(null)).not.toThrow();
    expect(() => useMembersByPlanSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('GetUsersDocument', () => {
  it('should be defined', () => {
    expect(GetUsersDocument).toBeDefined();
    expect(typeof GetUsersDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetUsersDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetUsersDocument();
    const result2 = GetUsersDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetUsersDocument(null)).not.toThrow();
    expect(() => GetUsersDocument(undefined)).not.toThrow();
  });
});


describe('useGetUsersQuery', () => {
  it('should be defined', () => {
    expect(useGetUsersQuery).toBeDefined();
    expect(typeof useGetUsersQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetUsersQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetUsersQuery();
    const result2 = useGetUsersQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetUsersQuery(null)).not.toThrow();
    expect(() => useGetUsersQuery(undefined)).not.toThrow();
  });
});


describe('useGetUsersLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetUsersLazyQuery).toBeDefined();
    expect(typeof useGetUsersLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetUsersLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetUsersLazyQuery();
    const result2 = useGetUsersLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetUsersLazyQuery(null)).not.toThrow();
    expect(() => useGetUsersLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetUsersSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetUsersSuspenseQuery).toBeDefined();
    expect(typeof useGetUsersSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetUsersSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetUsersSuspenseQuery();
    const result2 = useGetUsersSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetUsersSuspenseQuery(null)).not.toThrow();
    expect(() => useGetUsersSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('GetUserDocument', () => {
  it('should be defined', () => {
    expect(GetUserDocument).toBeDefined();
    expect(typeof GetUserDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetUserDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetUserDocument();
    const result2 = GetUserDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetUserDocument(null)).not.toThrow();
    expect(() => GetUserDocument(undefined)).not.toThrow();
  });
});


describe('useGetUserQuery', () => {
  it('should be defined', () => {
    expect(useGetUserQuery).toBeDefined();
    expect(typeof useGetUserQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetUserQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetUserQuery();
    const result2 = useGetUserQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetUserQuery(null)).not.toThrow();
    expect(() => useGetUserQuery(undefined)).not.toThrow();
  });
});


describe('useGetUserLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetUserLazyQuery).toBeDefined();
    expect(typeof useGetUserLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetUserLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetUserLazyQuery();
    const result2 = useGetUserLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetUserLazyQuery(null)).not.toThrow();
    expect(() => useGetUserLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetUserSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetUserSuspenseQuery).toBeDefined();
    expect(typeof useGetUserSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetUserSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetUserSuspenseQuery();
    const result2 = useGetUserSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetUserSuspenseQuery(null)).not.toThrow();
    expect(() => useGetUserSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('CreateUserDocument', () => {
  it('should be defined', () => {
    expect(CreateUserDocument).toBeDefined();
    expect(typeof CreateUserDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => CreateUserDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = CreateUserDocument();
    const result2 = CreateUserDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => CreateUserDocument(null)).not.toThrow();
    expect(() => CreateUserDocument(undefined)).not.toThrow();
  });
});


describe('useCreateUserMutation', () => {
  it('should be defined', () => {
    expect(useCreateUserMutation).toBeDefined();
    expect(typeof useCreateUserMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useCreateUserMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useCreateUserMutation();
    const result2 = useCreateUserMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useCreateUserMutation(null)).not.toThrow();
    expect(() => useCreateUserMutation(undefined)).not.toThrow();
  });
});


describe('UpdateUserDocument', () => {
  it('should be defined', () => {
    expect(UpdateUserDocument).toBeDefined();
    expect(typeof UpdateUserDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => UpdateUserDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = UpdateUserDocument();
    const result2 = UpdateUserDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => UpdateUserDocument(null)).not.toThrow();
    expect(() => UpdateUserDocument(undefined)).not.toThrow();
  });
});


describe('useUpdateUserMutation', () => {
  it('should be defined', () => {
    expect(useUpdateUserMutation).toBeDefined();
    expect(typeof useUpdateUserMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useUpdateUserMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useUpdateUserMutation();
    const result2 = useUpdateUserMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useUpdateUserMutation(null)).not.toThrow();
    expect(() => useUpdateUserMutation(undefined)).not.toThrow();
  });
});


describe('DeleteUserDocument', () => {
  it('should be defined', () => {
    expect(DeleteUserDocument).toBeDefined();
    expect(typeof DeleteUserDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => DeleteUserDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = DeleteUserDocument();
    const result2 = DeleteUserDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => DeleteUserDocument(null)).not.toThrow();
    expect(() => DeleteUserDocument(undefined)).not.toThrow();
  });
});


describe('useDeleteUserMutation', () => {
  it('should be defined', () => {
    expect(useDeleteUserMutation).toBeDefined();
    expect(typeof useDeleteUserMutation).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useDeleteUserMutation()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useDeleteUserMutation();
    const result2 = useDeleteUserMutation();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useDeleteUserMutation(null)).not.toThrow();
    expect(() => useDeleteUserMutation(undefined)).not.toThrow();
  });
});


describe('GetSubscriptionsDocument', () => {
  it('should be defined', () => {
    expect(GetSubscriptionsDocument).toBeDefined();
    expect(typeof GetSubscriptionsDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetSubscriptionsDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetSubscriptionsDocument();
    const result2 = GetSubscriptionsDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetSubscriptionsDocument(null)).not.toThrow();
    expect(() => GetSubscriptionsDocument(undefined)).not.toThrow();
  });
});


describe('useGetSubscriptions', () => {
  it('should be defined', () => {
    expect(useGetSubscriptions).toBeDefined();
    expect(typeof useGetSubscriptions).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetSubscriptions()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetSubscriptions();
    const result2 = useGetSubscriptions();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetSubscriptions(null)).not.toThrow();
    expect(() => useGetSubscriptions(undefined)).not.toThrow();
  });
});


describe('useGetSubscriptionsLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetSubscriptionsLazyQuery).toBeDefined();
    expect(typeof useGetSubscriptionsLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetSubscriptionsLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetSubscriptionsLazyQuery();
    const result2 = useGetSubscriptionsLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetSubscriptionsLazyQuery(null)).not.toThrow();
    expect(() => useGetSubscriptionsLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetSubscriptionsSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetSubscriptionsSuspenseQuery).toBeDefined();
    expect(typeof useGetSubscriptionsSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetSubscriptionsSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetSubscriptionsSuspenseQuery();
    const result2 = useGetSubscriptionsSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetSubscriptionsSuspenseQuery(null)).not.toThrow();
    expect(() => useGetSubscriptionsSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('GetSubscriptionDocument', () => {
  it('should be defined', () => {
    expect(GetSubscriptionDocument).toBeDefined();
    expect(typeof GetSubscriptionDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetSubscriptionDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetSubscriptionDocument();
    const result2 = GetSubscriptionDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetSubscriptionDocument(null)).not.toThrow();
    expect(() => GetSubscriptionDocument(undefined)).not.toThrow();
  });
});


describe('useGetSubscription', () => {
  it('should be defined', () => {
    expect(useGetSubscription).toBeDefined();
    expect(typeof useGetSubscription).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetSubscription()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetSubscription();
    const result2 = useGetSubscription();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetSubscription(null)).not.toThrow();
    expect(() => useGetSubscription(undefined)).not.toThrow();
  });
});


describe('useGetSubscriptionLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetSubscriptionLazyQuery).toBeDefined();
    expect(typeof useGetSubscriptionLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetSubscriptionLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetSubscriptionLazyQuery();
    const result2 = useGetSubscriptionLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetSubscriptionLazyQuery(null)).not.toThrow();
    expect(() => useGetSubscriptionLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetSubscriptionSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetSubscriptionSuspenseQuery).toBeDefined();
    expect(typeof useGetSubscriptionSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetSubscriptionSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetSubscriptionSuspenseQuery();
    const result2 = useGetSubscriptionSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetSubscriptionSuspenseQuery(null)).not.toThrow();
    expect(() => useGetSubscriptionSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('GetGradesDocument', () => {
  it('should be defined', () => {
    expect(GetGradesDocument).toBeDefined();
    expect(typeof GetGradesDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetGradesDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetGradesDocument();
    const result2 = GetGradesDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetGradesDocument(null)).not.toThrow();
    expect(() => GetGradesDocument(undefined)).not.toThrow();
  });
});


describe('useGetGradesQuery', () => {
  it('should be defined', () => {
    expect(useGetGradesQuery).toBeDefined();
    expect(typeof useGetGradesQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetGradesQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetGradesQuery();
    const result2 = useGetGradesQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetGradesQuery(null)).not.toThrow();
    expect(() => useGetGradesQuery(undefined)).not.toThrow();
  });
});


describe('useGetGradesLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetGradesLazyQuery).toBeDefined();
    expect(typeof useGetGradesLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetGradesLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetGradesLazyQuery();
    const result2 = useGetGradesLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetGradesLazyQuery(null)).not.toThrow();
    expect(() => useGetGradesLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetGradesSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetGradesSuspenseQuery).toBeDefined();
    expect(typeof useGetGradesSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetGradesSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetGradesSuspenseQuery();
    const result2 = useGetGradesSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetGradesSuspenseQuery(null)).not.toThrow();
    expect(() => useGetGradesSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('GetGradeDocument', () => {
  it('should be defined', () => {
    expect(GetGradeDocument).toBeDefined();
    expect(typeof GetGradeDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetGradeDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetGradeDocument();
    const result2 = GetGradeDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetGradeDocument(null)).not.toThrow();
    expect(() => GetGradeDocument(undefined)).not.toThrow();
  });
});


describe('useGetGradeQuery', () => {
  it('should be defined', () => {
    expect(useGetGradeQuery).toBeDefined();
    expect(typeof useGetGradeQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetGradeQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetGradeQuery();
    const result2 = useGetGradeQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetGradeQuery(null)).not.toThrow();
    expect(() => useGetGradeQuery(undefined)).not.toThrow();
  });
});


describe('useGetGradeLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetGradeLazyQuery).toBeDefined();
    expect(typeof useGetGradeLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetGradeLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetGradeLazyQuery();
    const result2 = useGetGradeLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetGradeLazyQuery(null)).not.toThrow();
    expect(() => useGetGradeLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetGradeSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetGradeSuspenseQuery).toBeDefined();
    expect(typeof useGetGradeSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetGradeSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetGradeSuspenseQuery();
    const result2 = useGetGradeSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetGradeSuspenseQuery(null)).not.toThrow();
    expect(() => useGetGradeSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('GetStatusesDocument', () => {
  it('should be defined', () => {
    expect(GetStatusesDocument).toBeDefined();
    expect(typeof GetStatusesDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetStatusesDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetStatusesDocument();
    const result2 = GetStatusesDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetStatusesDocument(null)).not.toThrow();
    expect(() => GetStatusesDocument(undefined)).not.toThrow();
  });
});


describe('useGetStatusesQuery', () => {
  it('should be defined', () => {
    expect(useGetStatusesQuery).toBeDefined();
    expect(typeof useGetStatusesQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetStatusesQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetStatusesQuery();
    const result2 = useGetStatusesQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetStatusesQuery(null)).not.toThrow();
    expect(() => useGetStatusesQuery(undefined)).not.toThrow();
  });
});


describe('useGetStatusesLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetStatusesLazyQuery).toBeDefined();
    expect(typeof useGetStatusesLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetStatusesLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetStatusesLazyQuery();
    const result2 = useGetStatusesLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetStatusesLazyQuery(null)).not.toThrow();
    expect(() => useGetStatusesLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetStatusesSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetStatusesSuspenseQuery).toBeDefined();
    expect(typeof useGetStatusesSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetStatusesSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetStatusesSuspenseQuery();
    const result2 = useGetStatusesSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetStatusesSuspenseQuery(null)).not.toThrow();
    expect(() => useGetStatusesSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('GetStatusDocument', () => {
  it('should be defined', () => {
    expect(GetStatusDocument).toBeDefined();
    expect(typeof GetStatusDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetStatusDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetStatusDocument();
    const result2 = GetStatusDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetStatusDocument(null)).not.toThrow();
    expect(() => GetStatusDocument(undefined)).not.toThrow();
  });
});


describe('useGetStatusQuery', () => {
  it('should be defined', () => {
    expect(useGetStatusQuery).toBeDefined();
    expect(typeof useGetStatusQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetStatusQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetStatusQuery();
    const result2 = useGetStatusQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetStatusQuery(null)).not.toThrow();
    expect(() => useGetStatusQuery(undefined)).not.toThrow();
  });
});


describe('useGetStatusLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetStatusLazyQuery).toBeDefined();
    expect(typeof useGetStatusLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetStatusLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetStatusLazyQuery();
    const result2 = useGetStatusLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetStatusLazyQuery(null)).not.toThrow();
    expect(() => useGetStatusLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetStatusSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetStatusSuspenseQuery).toBeDefined();
    expect(typeof useGetStatusSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetStatusSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetStatusSuspenseQuery();
    const result2 = useGetStatusSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetStatusSuspenseQuery(null)).not.toThrow();
    expect(() => useGetStatusSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('GetGendersDocument', () => {
  it('should be defined', () => {
    expect(GetGendersDocument).toBeDefined();
    expect(typeof GetGendersDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetGendersDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetGendersDocument();
    const result2 = GetGendersDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetGendersDocument(null)).not.toThrow();
    expect(() => GetGendersDocument(undefined)).not.toThrow();
  });
});


describe('useGetGendersQuery', () => {
  it('should be defined', () => {
    expect(useGetGendersQuery).toBeDefined();
    expect(typeof useGetGendersQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetGendersQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetGendersQuery();
    const result2 = useGetGendersQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetGendersQuery(null)).not.toThrow();
    expect(() => useGetGendersQuery(undefined)).not.toThrow();
  });
});


describe('useGetGendersLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetGendersLazyQuery).toBeDefined();
    expect(typeof useGetGendersLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetGendersLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetGendersLazyQuery();
    const result2 = useGetGendersLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetGendersLazyQuery(null)).not.toThrow();
    expect(() => useGetGendersLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetGendersSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetGendersSuspenseQuery).toBeDefined();
    expect(typeof useGetGendersSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetGendersSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetGendersSuspenseQuery();
    const result2 = useGetGendersSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetGendersSuspenseQuery(null)).not.toThrow();
    expect(() => useGetGendersSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('GetGenderDocument', () => {
  it('should be defined', () => {
    expect(GetGenderDocument).toBeDefined();
    expect(typeof GetGenderDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetGenderDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetGenderDocument();
    const result2 = GetGenderDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetGenderDocument(null)).not.toThrow();
    expect(() => GetGenderDocument(undefined)).not.toThrow();
  });
});


describe('useGetGenderQuery', () => {
  it('should be defined', () => {
    expect(useGetGenderQuery).toBeDefined();
    expect(typeof useGetGenderQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetGenderQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetGenderQuery();
    const result2 = useGetGenderQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetGenderQuery(null)).not.toThrow();
    expect(() => useGetGenderQuery(undefined)).not.toThrow();
  });
});


describe('useGetGenderLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetGenderLazyQuery).toBeDefined();
    expect(typeof useGetGenderLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetGenderLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetGenderLazyQuery();
    const result2 = useGetGenderLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetGenderLazyQuery(null)).not.toThrow();
    expect(() => useGetGenderLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetGenderSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetGenderSuspenseQuery).toBeDefined();
    expect(typeof useGetGenderSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetGenderSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetGenderSuspenseQuery();
    const result2 = useGetGenderSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetGenderSuspenseQuery(null)).not.toThrow();
    expect(() => useGetGenderSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('GetUserSubscriptionDocument', () => {
  it('should be defined', () => {
    expect(GetUserSubscriptionDocument).toBeDefined();
    expect(typeof GetUserSubscriptionDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => GetUserSubscriptionDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = GetUserSubscriptionDocument();
    const result2 = GetUserSubscriptionDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => GetUserSubscriptionDocument(null)).not.toThrow();
    expect(() => GetUserSubscriptionDocument(undefined)).not.toThrow();
  });
});


describe('useGetUserSubscription', () => {
  it('should be defined', () => {
    expect(useGetUserSubscription).toBeDefined();
    expect(typeof useGetUserSubscription).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetUserSubscription()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetUserSubscription();
    const result2 = useGetUserSubscription();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetUserSubscription(null)).not.toThrow();
    expect(() => useGetUserSubscription(undefined)).not.toThrow();
  });
});


describe('useGetUserSubscriptionLazyQuery', () => {
  it('should be defined', () => {
    expect(useGetUserSubscriptionLazyQuery).toBeDefined();
    expect(typeof useGetUserSubscriptionLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetUserSubscriptionLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetUserSubscriptionLazyQuery();
    const result2 = useGetUserSubscriptionLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetUserSubscriptionLazyQuery(null)).not.toThrow();
    expect(() => useGetUserSubscriptionLazyQuery(undefined)).not.toThrow();
  });
});


describe('useGetUserSubscriptionSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useGetUserSubscriptionSuspenseQuery).toBeDefined();
    expect(typeof useGetUserSubscriptionSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useGetUserSubscriptionSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useGetUserSubscriptionSuspenseQuery();
    const result2 = useGetUserSubscriptionSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useGetUserSubscriptionSuspenseQuery(null)).not.toThrow();
    expect(() => useGetUserSubscriptionSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('CheckProductByNameAndCategoryDocument', () => {
  it('should be defined', () => {
    expect(CheckProductByNameAndCategoryDocument).toBeDefined();
    expect(typeof CheckProductByNameAndCategoryDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => CheckProductByNameAndCategoryDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = CheckProductByNameAndCategoryDocument();
    const result2 = CheckProductByNameAndCategoryDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => CheckProductByNameAndCategoryDocument(null)).not.toThrow();
    expect(() => CheckProductByNameAndCategoryDocument(undefined)).not.toThrow();
  });
});


describe('useCheckProductByNameAndCategoryQuery', () => {
  it('should be defined', () => {
    expect(useCheckProductByNameAndCategoryQuery).toBeDefined();
    expect(typeof useCheckProductByNameAndCategoryQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useCheckProductByNameAndCategoryQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useCheckProductByNameAndCategoryQuery();
    const result2 = useCheckProductByNameAndCategoryQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useCheckProductByNameAndCategoryQuery(null)).not.toThrow();
    expect(() => useCheckProductByNameAndCategoryQuery(undefined)).not.toThrow();
  });
});


describe('useCheckProductByNameAndCategoryLazyQuery', () => {
  it('should be defined', () => {
    expect(useCheckProductByNameAndCategoryLazyQuery).toBeDefined();
    expect(typeof useCheckProductByNameAndCategoryLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useCheckProductByNameAndCategoryLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useCheckProductByNameAndCategoryLazyQuery();
    const result2 = useCheckProductByNameAndCategoryLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useCheckProductByNameAndCategoryLazyQuery(null)).not.toThrow();
    expect(() => useCheckProductByNameAndCategoryLazyQuery(undefined)).not.toThrow();
  });
});


describe('useCheckProductByNameAndCategorySuspenseQuery', () => {
  it('should be defined', () => {
    expect(useCheckProductByNameAndCategorySuspenseQuery).toBeDefined();
    expect(typeof useCheckProductByNameAndCategorySuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useCheckProductByNameAndCategorySuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useCheckProductByNameAndCategorySuspenseQuery();
    const result2 = useCheckProductByNameAndCategorySuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useCheckProductByNameAndCategorySuspenseQuery(null)).not.toThrow();
    expect(() => useCheckProductByNameAndCategorySuspenseQuery(undefined)).not.toThrow();
  });
});


describe('CheckProductByNameDocument', () => {
  it('should be defined', () => {
    expect(CheckProductByNameDocument).toBeDefined();
    expect(typeof CheckProductByNameDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => CheckProductByNameDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = CheckProductByNameDocument();
    const result2 = CheckProductByNameDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => CheckProductByNameDocument(null)).not.toThrow();
    expect(() => CheckProductByNameDocument(undefined)).not.toThrow();
  });
});


describe('useCheckProductByNameQuery', () => {
  it('should be defined', () => {
    expect(useCheckProductByNameQuery).toBeDefined();
    expect(typeof useCheckProductByNameQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useCheckProductByNameQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useCheckProductByNameQuery();
    const result2 = useCheckProductByNameQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useCheckProductByNameQuery(null)).not.toThrow();
    expect(() => useCheckProductByNameQuery(undefined)).not.toThrow();
  });
});


describe('useCheckProductByNameLazyQuery', () => {
  it('should be defined', () => {
    expect(useCheckProductByNameLazyQuery).toBeDefined();
    expect(typeof useCheckProductByNameLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useCheckProductByNameLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useCheckProductByNameLazyQuery();
    const result2 = useCheckProductByNameLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useCheckProductByNameLazyQuery(null)).not.toThrow();
    expect(() => useCheckProductByNameLazyQuery(undefined)).not.toThrow();
  });
});


describe('useCheckProductByNameSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useCheckProductByNameSuspenseQuery).toBeDefined();
    expect(typeof useCheckProductByNameSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useCheckProductByNameSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useCheckProductByNameSuspenseQuery();
    const result2 = useCheckProductByNameSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useCheckProductByNameSuspenseQuery(null)).not.toThrow();
    expect(() => useCheckProductByNameSuspenseQuery(undefined)).not.toThrow();
  });
});


describe('CheckCourseScheduleDocument', () => {
  it('should be defined', () => {
    expect(CheckCourseScheduleDocument).toBeDefined();
    expect(typeof CheckCourseScheduleDocument).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => CheckCourseScheduleDocument()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = CheckCourseScheduleDocument();
    const result2 = CheckCourseScheduleDocument();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => CheckCourseScheduleDocument(null)).not.toThrow();
    expect(() => CheckCourseScheduleDocument(undefined)).not.toThrow();
  });
});


describe('useCheckCourseScheduleQuery', () => {
  it('should be defined', () => {
    expect(useCheckCourseScheduleQuery).toBeDefined();
    expect(typeof useCheckCourseScheduleQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useCheckCourseScheduleQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useCheckCourseScheduleQuery();
    const result2 = useCheckCourseScheduleQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useCheckCourseScheduleQuery(null)).not.toThrow();
    expect(() => useCheckCourseScheduleQuery(undefined)).not.toThrow();
  });
});


describe('useCheckCourseScheduleLazyQuery', () => {
  it('should be defined', () => {
    expect(useCheckCourseScheduleLazyQuery).toBeDefined();
    expect(typeof useCheckCourseScheduleLazyQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useCheckCourseScheduleLazyQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useCheckCourseScheduleLazyQuery();
    const result2 = useCheckCourseScheduleLazyQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useCheckCourseScheduleLazyQuery(null)).not.toThrow();
    expect(() => useCheckCourseScheduleLazyQuery(undefined)).not.toThrow();
  });
});


describe('useCheckCourseScheduleSuspenseQuery', () => {
  it('should be defined', () => {
    expect(useCheckCourseScheduleSuspenseQuery).toBeDefined();
    expect(typeof useCheckCourseScheduleSuspenseQuery).toBe('function');
  });

  it('should execute without errors', () => {
    expect(() => useCheckCourseScheduleSuspenseQuery()).not.toThrow();
  });

  it('should return consistent results', () => {
    const result1 = useCheckCourseScheduleSuspenseQuery();
    const result2 = useCheckCourseScheduleSuspenseQuery();

    expect(result1).toEqual(result2);
  });

  it('should handle edge cases', () => {
    expect(() => useCheckCourseScheduleSuspenseQuery(null)).not.toThrow();
    expect(() => useCheckCourseScheduleSuspenseQuery(undefined)).not.toThrow();
  });
});

