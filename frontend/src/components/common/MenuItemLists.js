const regularItems = (history) => {
  return [
    {
      text: 'Log In',
      description: 'Log in with your University of Helsinki account.',
      handler: () => history.push('/login'),
    },
  ]
}

const loggedInUnregisteredItems = (history) => {
  return [
    {
      text: 'Home',
      description: 'Front page of the course.',
      handler: () => history.push('/'),
    },
    {
      text: 'Register',
      description: 'Register for the course and choose your preferred topics.',
      handler: () => history.push('/register'),
    },
    {
      text: 'Registration Details',
      description: 'See the details of your registration and your group.',
      handler: () => history.push('/registrationdetails'),
    },
  ]
}

const loggedInItems = (history) => {
  return [
    {
      text: 'Home',
      description: 'Front page of the course.',
      handler: () => history.push('/'),
    },
    {
      text: 'Registration Details',
      description: 'See the details of your registration and your group.',
      handler: () => history.push('/registrationdetails'),
    },
    {
      text: 'Peer Review',
      description: 'Fill in the peer review of yourself and your groupmates.',
      handler: () => history.push('/peerreview'),
    },
    {
      text: 'Time Logs',
      description: 'Log the hours you spend on the project, sprint by sprint.',
      handler: () => history.push('/timelogs'),
    },
    {
      text: 'Sprint Dashboard',
      description: "Set the start and end dates of your group's sprints.",
      handler: () => history.push('/sprints'),
    },
    {
      text: 'Tags',
      description: "See how your group's logged hours split between tags.",
      handler: () => history.push('/student-tags'),
    },
  ]
}

const instructorItems = (history) => {
  return [
    {
      text: 'Home',
      description: 'Front page of the course.',
      handler: () => history.push('/'),
    },
    {
      text: 'Peer reviews',
      description:
        'Read the peer reviews students have written about themselves and their groupmates.',
      handler: () => history.push('/instructorpage'),
    },
    {
      text: 'Instructor Review',
      description: 'Write your assessment and grades for the students in the groups you instruct.',
      handler: () => history.push('/instructorreviewpage'),
    },
    {
      text: 'Customer reviews',
      description: 'Read the reviews customers have written about their groups.',
      handler: () => history.push('/adminstration/customer-reviews'),
    },
    {
      text: 'Group time logs',
      description: 'See and adjust the hours students in a group have logged, sprint by sprint.',
      handler: () => history.push('/instructor-timelogs'),
    },
    {
      text: 'Group tags',
      description: "See how a group's logged hours split between tags.",
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
          text: 'Course instance questions',
          description:
            'Create course instances (configurations) and choose the question sets each one uses.',
          handler: () => history.push('/administration/configuration'),
        },
        {
          className: 'registration-management-menu-item',
          text: 'Registration and review settings',
          description:
            'Open and close registrations and peer reviews, and choose the configuration each one uses.',
          handler: () => history.push('/administration/registrationmanagement'),
        },
        {
          className: 'customer-review-menu-item',
          text: 'Current registrations',
          description: 'List the students registered to the current course.',
          handler: () => history.push('/administration/registrations'),
        },
        {
          text: 'Participants',
          description:
            'Students of a configuration with their topic preferences and registration answers.',
          handler: () => history.push('/administration/participants'),
        },
        {
          text: 'Users',
          description: 'All users and the courses they have participated in or instructed.',
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
          description: 'Add a new project topic on behalf of a customer.',
          handler: () => history.push('/topics/create'),
        },
        {
          className: 'topics-menu-item',
          text: 'Topics',
          description: 'Browse and edit the project topics proposed by customers.',
          handler: () => history.push('/topics'),
        },
        {
          className: 'group-management-menu-item',
          text: 'Group Management',
          description: 'Create groups and assign students and an instructor to them.',
          handler: () => history.push('/administration/groups'),
        },
        {
          className: 'sprint-management-menu-item',
          text: 'Sprint Management',
          description: 'View and edit the sprints of each group.',
          handler: () => history.push('/administration/sprints'),
        },
      ],
    },
    {
      title: 'Reviews',
      items: [
        {
          text: 'Grades given by instructors',
          description: 'Read the assessments and grades instructors have given to students.',
          handler: () => history.push('/administration/reviews'),
        },
        {
          text: 'Registration Questions',
          description: 'Edit the question sets students answer when registering.',
          handler: () => history.push('/administration/registration-questions'),
        },
        {
          text: 'Customer Review Questions',
          description: 'Edit the question sets customers answer when reviewing their group.',
          handler: () => history.push('/administration/customer-review-questions'),
        },
        {
          text: 'Peer Review Questions',
          description: 'Edit the question sets students answer in the peer reviews.',
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
          description: 'Edit the emails sent to customers and students.',
          handler: () => history.push('/administration/email-templates'),
        },
        {
          className: 'tags-menu-item',
          text: 'Tag management',
          description: 'Create and edit the tags students use to categorise their time logs.',
          handler: () => history.push('/administration/tags'),
        },
        {
          className: 'tags-statistics-menu-item',
          text: 'Tag statistics',
          description: 'See how logged hours split between tags across groups.',
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
