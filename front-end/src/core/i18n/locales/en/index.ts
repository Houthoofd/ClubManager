/**
 * ====================================================================
 * ENGLISH TRANSLATIONS (en)
 * ====================================================================
 *
 * Comprehensive translations for ClubManager application.
 * Organized by feature namespaces for maintainability.
 *
 * Namespaces:
 * - common: Shared UI elements (buttons, labels, actions)
 * - navigation: Menu, routes, breadcrumbs
 * - auth: Authentication & authorization
 * - shop: E-commerce, products, cart
 * - courses: Course management
 * - users: User management
 * - messages: Messaging system
 * - orders: Order management
 * - stats: Statistics & analytics
 * - teachers: Teacher management
 * - errors: Error messages
 * - validation: Form validation messages
 */

export const en = {
  // ================================================================
  // COMMON - Shared UI Elements
  // ================================================================
  common: {
    // Actions
    actions: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      add: 'Add',
      remove: 'Remove',
      update: 'Update',
      confirm: 'Confirm',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      download: 'Download',
      upload: 'Upload',
      print: 'Print',
      refresh: 'Refresh',
      reset: 'Reset',
      clear: 'Clear',
      apply: 'Apply',
      view: 'View',
      details: 'Details',
      manage: 'Manage',
      configure: 'Configure',
      settings: 'Settings',
    },

    // Labels
    labels: {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
      city: 'City',
      country: 'Country',
      zipCode: 'Zip Code',
      description: 'Description',
      date: 'Date',
      time: 'Time',
      status: 'Status',
      type: 'Type',
      category: 'Category',
      price: 'Price',
      quantity: 'Quantity',
      total: 'Total',
      subtotal: 'Subtotal',
      tax: 'Tax',
      discount: 'Discount',
      notes: 'Notes',
      actions: 'Actions',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      language: 'Language',
      theme: 'Theme',
      notification: 'Notification',
      notifications: 'Notifications',
      profile: 'Profile',
      account: 'Account',
      preferences: 'Preferences',
    },

    // Status
    status: {
      active: 'Active',
      inactive: 'Inactive',
      pending: 'Pending',
      completed: 'Completed',
      cancelled: 'Cancelled',
      processing: 'Processing',
      confirmed: 'Confirmed',
      rejected: 'Rejected',
      draft: 'Draft',
      published: 'Published',
      archived: 'Archived',
    },

    // Messages
    messages: {
      loading: 'Loading...',
      saving: 'Saving...',
      saved: 'Saved successfully',
      error: 'An error occurred',
      success: 'Success',
      noData: 'No data available',
      noResults: 'No results found',
      confirmDelete: 'Are you sure you want to delete this item?',
      deleteSuccess: 'Item deleted successfully',
      updateSuccess: 'Updated successfully',
      createSuccess: 'Created successfully',
      invalidData: 'Invalid data',
      requiredField: 'This field is required',
      unsavedChanges: 'You have unsaved changes. Do you want to leave?',
    },

    // Time
    time: {
      today: 'Today',
      yesterday: 'Yesterday',
      tomorrow: 'Tomorrow',
      thisWeek: 'This Week',
      lastWeek: 'Last Week',
      thisMonth: 'This Month',
      lastMonth: 'Last Month',
      thisYear: 'This Year',
      custom: 'Custom',
    },

    // Pagination
    pagination: {
      page: 'Page',
      of: 'of',
      itemsPerPage: 'Items per page',
      showing: 'Showing',
      to: 'to',
      items: 'items',
      first: 'First',
      last: 'Last',
    },
  },

  // ================================================================
  // NAVIGATION - Menu & Routes
  // ================================================================
  navigation: {
    menu: {
      home: 'Home',
      dashboard: 'Dashboard',
      shop: 'Shop',
      courses: 'Courses',
      users: 'Users',
      messages: 'Messages',
      orders: 'Orders',
      stats: 'Statistics',
      teachers: 'Teachers',
      settings: 'Settings',
      logout: 'Logout',
      profile: 'My Profile',
      cart: 'Shopping Cart',
    },

    breadcrumbs: {
      home: 'Home',
      back: 'Back',
    },

    footer: {
      copyright: '© {{year}} ClubManager. All rights reserved.',
      version: 'Version {{version}}',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      contact: 'Contact Us',
    },
  },

  // ================================================================
  // AUTH - Authentication & Authorization
  // ================================================================
  auth: {
    login: {
      title: 'Sign In',
      subtitle: 'Welcome back to ClubManager',
      email: 'Email',
      password: 'Password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      submit: 'Sign In',
      noAccount: "Don't have an account?",
      signUp: 'Sign up',
      errors: {
        invalidCredentials: 'Invalid email or password',
        required: 'Email and password are required',
        emailFormat: 'Please enter a valid email',
      },
    },

    register: {
      title: 'Create Account',
      subtitle: 'Join ClubManager today',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      phone: 'Phone Number',
      submit: 'Create Account',
      hasAccount: 'Already have an account?',
      signIn: 'Sign in',
      terms: 'I agree to the Terms of Service and Privacy Policy',
      errors: {
        passwordMismatch: 'Passwords do not match',
        weakPassword: 'Password must be at least 8 characters',
        emailTaken: 'This email is already registered',
        termsRequired: 'You must accept the terms and conditions',
      },
    },

    forgotPassword: {
      title: 'Reset Password',
      subtitle: 'Enter your email to receive reset instructions',
      email: 'Email',
      submit: 'Send Reset Link',
      backToLogin: 'Back to login',
      success: 'Password reset link sent to your email',
    },

    profile: {
      title: 'My Profile',
      editProfile: 'Edit Profile',
      changePassword: 'Change Password',
      personalInfo: 'Personal Information',
      contactInfo: 'Contact Information',
      preferences: 'Preferences',
      security: 'Security',
    },

    roles: {
      admin: 'Administrator',
      teacher: 'Teacher',
      student: 'Student',
      member: 'Member',
      guest: 'Guest',
    },

    permissions: {
      noAccess: 'You do not have permission to access this page',
      contactAdmin: 'Please contact an administrator if you believe this is an error',
    },
  },

  // ================================================================
  // SHOP - E-commerce & Products
  // ================================================================
  shop: {
    products: {
      title: 'Shop',
      allProducts: 'All Products',
      categories: 'Categories',
      search: 'Search products...',
      sortBy: 'Sort by',
      price: 'Price',
      name: 'Name',
      newest: 'Newest',
      popularity: 'Popularity',
      inStock: 'In Stock',
      outOfStock: 'Out of Stock',
      lowStock: 'Low Stock',
      addToCart: 'Add to Cart',
      viewDetails: 'View Details',
      noProducts: 'No products found',
    },

    productDetails: {
      description: 'Description',
      specifications: 'Specifications',
      reviews: 'Reviews',
      relatedProducts: 'Related Products',
      addToCart: 'Add to Cart',
      quantity: 'Quantity',
      availability: 'Availability',
      sku: 'SKU',
      category: 'Category',
      tags: 'Tags',
    },

    cart: {
      title: 'Shopping Cart',
      empty: 'Your cart is empty',
      continueShopping: 'Continue Shopping',
      checkout: 'Proceed to Checkout',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      tax: 'Tax',
      total: 'Total',
      remove: 'Remove',
      update: 'Update',
      quantity: 'Quantity',
      price: 'Price',
      itemsCount: '{{count}} item',
      itemsCount_plural: '{{count}} items',
      clearCart: 'Clear Cart',
      confirmClear: 'Are you sure you want to clear your cart?',
    },

    checkout: {
      title: 'Checkout',
      shippingAddress: 'Shipping Address',
      billingAddress: 'Billing Address',
      sameAsShipping: 'Same as shipping address',
      paymentMethod: 'Payment Method',
      creditCard: 'Credit Card',
      paypal: 'PayPal',
      bankTransfer: 'Bank Transfer',
      reviewOrder: 'Review Order',
      placeOrder: 'Place Order',
      orderSummary: 'Order Summary',
      processing: 'Processing your order...',
      success: 'Order placed successfully!',
      orderNumber: 'Order Number',
      errors: {
        paymentFailed: 'Payment failed. Please try again.',
        invalidAddress: 'Please provide a valid address',
        invalidCard: 'Invalid card information',
      },
    },

    categories: {
      all: 'All Categories',
      equipment: 'Equipment',
      clothing: 'Clothing',
      accessories: 'Accessories',
      books: 'Books',
      digital: 'Digital Products',
    },
  },

  // ================================================================
  // COURSES - Course Management
  // ================================================================
  courses: {
    list: {
      title: 'Courses',
      allCourses: 'All Courses',
      myCourses: 'My Courses',
      available: 'Available Courses',
      enrolled: 'Enrolled',
      upcoming: 'Upcoming',
      past: 'Past',
      search: 'Search courses...',
      noCourses: 'No courses found',
    },

    details: {
      overview: 'Overview',
      schedule: 'Schedule',
      instructor: 'Instructor',
      participants: 'Participants',
      materials: 'Materials',
      enroll: 'Enroll',
      enrolled: 'Enrolled',
      waitlist: 'Join Waitlist',
      full: 'Course Full',
      startDate: 'Start Date',
      endDate: 'End Date',
      duration: 'Duration',
      level: 'Level',
      capacity: 'Capacity',
      spotsLeft: '{{count}} spot left',
      spotsLeft_plural: '{{count}} spots left',
    },

    create: {
      title: 'Create Course',
      basicInfo: 'Basic Information',
      schedule: 'Schedule',
      pricing: 'Pricing',
      advanced: 'Advanced Settings',
      submit: 'Create Course',
      success: 'Course created successfully',
    },

    edit: {
      title: 'Edit Course',
      submit: 'Update Course',
      success: 'Course updated successfully',
    },

    levels: {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      expert: 'Expert',
      allLevels: 'All Levels',
    },
  },

  // ================================================================
  // USERS - User Management
  // ================================================================
  users: {
    list: {
      title: 'Users',
      allUsers: 'All Users',
      active: 'Active',
      inactive: 'Inactive',
      search: 'Search users...',
      addUser: 'Add User',
      noUsers: 'No users found',
    },

    details: {
      info: 'User Information',
      courses: 'Enrolled Courses',
      orders: 'Order History',
      activity: 'Activity Log',
      edit: 'Edit User',
      delete: 'Delete User',
      activate: 'Activate',
      deactivate: 'Deactivate',
    },

    create: {
      title: 'Add New User',
      submit: 'Create User',
      success: 'User created successfully',
    },

    edit: {
      title: 'Edit User',
      submit: 'Update User',
      success: 'User updated successfully',
    },

    fields: {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      role: 'Role',
      status: 'Status',
      joinDate: 'Join Date',
      lastLogin: 'Last Login',
    },
  },

  // ================================================================
  // MESSAGES - Messaging System
  // ================================================================
  messages: {
    list: {
      title: 'Messages',
      inbox: 'Inbox',
      sent: 'Sent',
      drafts: 'Drafts',
      archived: 'Archived',
      compose: 'Compose',
      noMessages: 'No messages',
    },

    compose: {
      title: 'New Message',
      to: 'To',
      subject: 'Subject',
      message: 'Message',
      send: 'Send',
      saveDraft: 'Save Draft',
      discard: 'Discard',
      attachments: 'Attachments',
      addAttachment: 'Add Attachment',
    },

    view: {
      reply: 'Reply',
      replyAll: 'Reply All',
      forward: 'Forward',
      archive: 'Archive',
      delete: 'Delete',
      markUnread: 'Mark as Unread',
      markRead: 'Mark as Read',
    },

    notifications: {
      newMessage: 'New message from {{sender}}',
      messageSent: 'Message sent successfully',
      messageDraft: 'Draft saved',
    },
  },

  // ================================================================
  // ORDERS - Order Management
  // ================================================================
  orders: {
    list: {
      title: 'Orders',
      myOrders: 'My Orders',
      allOrders: 'All Orders',
      search: 'Search orders...',
      noOrders: 'No orders found',
    },

    details: {
      title: 'Order Details',
      orderNumber: 'Order #{{number}}',
      date: 'Order Date',
      status: 'Status',
      items: 'Items',
      shipping: 'Shipping Information',
      billing: 'Billing Information',
      payment: 'Payment Information',
      total: 'Total',
      invoice: 'Download Invoice',
      track: 'Track Shipment',
    },

    status: {
      pending: 'Pending',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
    },

    actions: {
      cancel: 'Cancel Order',
      refund: 'Request Refund',
      reorder: 'Reorder',
      confirmCancel: 'Are you sure you want to cancel this order?',
    },
  },

  // ================================================================
  // STATS - Statistics & Analytics
  // ================================================================
  stats: {
    dashboard: {
      title: 'Dashboard',
      overview: 'Overview',
      analytics: 'Analytics',
      reports: 'Reports',
    },

    metrics: {
      totalUsers: 'Total Users',
      activeUsers: 'Active Users',
      totalCourses: 'Total Courses',
      enrollments: 'Enrollments',
      revenue: 'Revenue',
      orders: 'Orders',
      growth: 'Growth',
      thisMonth: 'This Month',
      lastMonth: 'Last Month',
      change: 'Change',
    },

    charts: {
      userGrowth: 'User Growth',
      revenue: 'Revenue',
      enrollments: 'Enrollments',
      orders: 'Orders',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
    },
  },

  // ================================================================
  // TEACHERS - Teacher Management
  // ================================================================
  teachers: {
    list: {
      title: 'Teachers',
      allTeachers: 'All Teachers',
      search: 'Search teachers...',
      addTeacher: 'Add Teacher',
      noTeachers: 'No teachers found',
    },

    details: {
      bio: 'Biography',
      specializations: 'Specializations',
      courses: 'Courses',
      schedule: 'Schedule',
      ratings: 'Ratings',
      reviews: 'Reviews',
    },

    create: {
      title: 'Add New Teacher',
      submit: 'Create Teacher',
      success: 'Teacher created successfully',
    },

    edit: {
      title: 'Edit Teacher',
      submit: 'Update Teacher',
      success: 'Teacher updated successfully',
    },
  },

  // ================================================================
  // ERRORS - Error Messages
  // ================================================================
  errors: {
    generic: 'An error occurred. Please try again.',
    network: 'Network error. Please check your connection.',
    notFound: 'Page not found',
    unauthorized: 'Unauthorized. Please log in.',
    forbidden: 'Access denied',
    serverError: 'Server error. Please try again later.',
    timeout: 'Request timeout. Please try again.',
    validation: 'Validation error. Please check your input.',

    form: {
      required: 'This field is required',
      email: 'Please enter a valid email',
      phone: 'Please enter a valid phone number',
      url: 'Please enter a valid URL',
      number: 'Please enter a valid number',
      min: 'Minimum value is {{min}}',
      max: 'Maximum value is {{max}}',
      minLength: 'Minimum length is {{min}} characters',
      maxLength: 'Maximum length is {{max}} characters',
      pattern: 'Invalid format',
    },

    boundary: {
      title: 'Oops! Something went wrong',
      message: 'We encountered an unexpected error. Our team has been notified.',
      reload: 'Reload Page',
      home: 'Go Home',
      report: 'Report Issue',
    },
  },

  // ================================================================
  // VALIDATION - Form Validation Messages
  // ================================================================
  validation: {
    required: '{{field}} is required',
    email: 'Please enter a valid email address',
    phone: 'Please enter a valid phone number',
    minLength: '{{field}} must be at least {{min}} characters',
    maxLength: '{{field}} must not exceed {{max}} characters',
    min: '{{field}} must be at least {{min}}',
    max: '{{field}} must not exceed {{max}}',
    pattern: 'Invalid {{field}} format',
    match: '{{field}} must match {{match}}',
    unique: '{{field}} already exists',
    alphanumeric: '{{field}} must contain only letters and numbers',
    url: 'Please enter a valid URL',
    date: 'Please enter a valid date',
    time: 'Please enter a valid time',
    password: {
      weak: 'Password is too weak',
      strong: 'Password is strong',
      requirements: 'Password must contain at least 8 characters, one uppercase, one lowercase, and one number',
    },
  },

  // ================================================================
  // LANGUAGE - Language Selector
  // ================================================================
  language: {
    select: 'Select Language',
    current: 'Current Language',
    en: 'English',
    fr: 'Français',
    nl: 'Nederlands',
    changeSuccess: 'Language changed to English',
  },
};

export default en;
