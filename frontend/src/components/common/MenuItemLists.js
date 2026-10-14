const regularItems = (history) => {
  return [
    {
      text: 'Log In',
      handler: () => history.push('/login'),
    },
  ]
}

const loggedInUnregisteredItems = (history) => {
  return [
    {
      text: 'Home',
      handler: () => history.push('/'),
    },
    {
      text: 'Register',
      handler: () => history.push('/register'),
    },
    {
      text: 'Registration Details',
      handler: () => history.push('/registrationdetails'),
    },
  ]
}

const loggedInItems = (history) => {
  return [
    {
      text: 'Home',
      handler: () => history.push('/'),
    },
    {
      text: 'Registration Details',
      handler: () => history.push('/registrationdetails'),
    },
    {
      text: 'Peer Review',
      handler: () => history.push('/peerreview'),
    },
    {
      text: 'Time Logs',
      handler: () => history.push('/timelogs'),
    },
    {
      text: 'Sprint Dashboard',
      handler: () => history.push('/sprints'),
    },
    {
      text: 'Tags',
      handler: () => history.push('/student-tags'),
    },
  ]
}

const instructorItems = (history) => {
  return [
    {
      text: 'Home',
      handler: () => history.push('/'),
    },
    {
      text: 'Peer reviews',
      handler: () => history.push('/instructorpage'),
    },
    {
      text: 'Instructor Review',
      handler: () => history.push('/instructorreviewpage'),
    },
    {
      text: 'Customer reviews',
      handler: () => history.push('/adminstration/customer-reviews'),
    },
    {
      text: 'Group time logs',
      handler: () => history.push('/instructor-timelogs'),
    },
    {
      text: 'Group tags',
      handler: () => history.push('/instructor-tags'),
    },
  ]
}

const adminItems = (history) => {
  return [
    {
      title: 'Course',
      items: [
        {
          className: 'configuration-menu-item',
          text: 'Configuration',
          handler: () => history.push('/administration/configuration'),
        },
        {
          className: 'registration-management-menu-item',
          text: 'Registration Management',
          handler: () => history.push('/administration/registrationmanagement'),
        },
        {
          className: 'customer-review-menu-item',
          text: 'Current registrations',
          handler: () => history.push('/administration/registrations'),
        },
        {
          text: 'Participants',
          handler: () => history.push('/administration/participants'),
        },
        {
          text: 'Users',
          handler: () => history.push('/administration/users'),
        },
      ],
    },
    {
      title: 'Topics and groups',
      items: [
        {
          className: 'create-topic-menu-item',
          text: 'Create Topic',
          handler: () => history.push('/topics/create'),
        },
        {
          className: 'topics-menu-item',
          text: 'Topics',
          handler: () => history.push('/topics'),
        },
        {
          className: 'group-management-menu-item',
          text: 'Group Management',
          handler: () => history.push('/administration/groups'),
        },
        {
          className: 'sprint-management-menu-item',
          text: 'Sprint Management',
          handler: () => history.push('/administration/sprints'),
        },
      ],
    },
    {
      title: 'Reviews',
      items: [
        {
          text: 'Grades given by instructors',
          handler: () => history.push('/administration/reviews'),
        },
        {
          text: 'Registration Questions',
          handler: () => history.push('/administration/registration-questions'),
        },
        {
          text: 'Customer Review Questions',
          handler: () => history.push('/administration/customer-review-questions'),
        },
        {
          text: 'Peer Review Questions',
          handler: () => history.push('/administration/peer-review-questions'),
        },
      ],
    },
    {
      title: 'Emails and tags',
      items: [
        {
          className: 'email-templates-menu-item',
          text: 'Email Templates',
          handler: () => history.push('/administration/email-templates'),
        },
        {
          className: 'tags-menu-item',
          text: 'Tag management',
          handler: () => history.push('/administration/tags'),
        },
        {
          className: 'tags-statistics-menu-item',
          text: 'Tag statistics',
          handler: () => history.push('/administration/tags-statistics'),
        },
      ],
    },
  ]
}

// admins get a single menu: everything an instructor can do, the admin tools and
// the student pages
const adminMenuSections = (history) => {
  const registerItem = loggedInUnregisteredItems(history).find((item) => item.text === 'Register')
  return [
    { title: 'Teaching', items: instructorItems(history) },
    ...adminItems(history),
    {
      title: 'Student view',
      items: [registerItem, ...loggedInItems(history).filter((item) => item.text !== 'Home')],
    },
  ]
}

export {
  regularItems,
  loggedInUnregisteredItems,
  loggedInItems,
  adminItems,
  instructorItems,
  adminMenuSections,
}
