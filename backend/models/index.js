const Sequelize = require('sequelize')

const db = {}

db.connect = () => {
  const sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false })

  sequelize
    .authenticate()
    .then(() => {
      console.log('Connection has been established successfully.')
    })
    .catch((err) => {
      console.error('Unable to connect to the database:', err)
    })

  const UserModel = require('./user')
  const GroupModel = require('./group')
  const TopicModel = require('./topic')
  const TopicDateModel = require('./topic_date')
  const RegistrationModel = require('./registration')
  const ConfigurationModel = require('./configuration')
  const RegistrationQuestionSetModel = require('./registration_question_set')
  const ReviewQuestionSetModel = require('./review_question_set')

  const CustomerReviewQuestionSetModel = require('./customer_review_question_set')

  //const Review = require('./review')
  //const Review_answer = require('./review_answer')
  const RegistrationManagementModel = require('./registration_management')
  const PeerReviewModel = require('./peer_review')
  const EmailTemplateModel = require('./email_template')
  const InstructorReviewModel = require('./instructor_review')
  const CustomerReviewModel = require('./customer_review')
  const SentTopicEmailModel = require('./sent_topic_email')

  const SprintModel = require('./sprint')
  const TagModel = require('./tag')
  const TimeLogModel = require('./time_log')
  const TimeLogTagModel = require('./time_log_tag')

  const User = UserModel(sequelize, Sequelize)
  const Group = GroupModel(sequelize, Sequelize)
  const Topic = TopicModel(sequelize, Sequelize)
  const TopicDate = TopicDateModel(sequelize, Sequelize)
  const Registration = RegistrationModel(sequelize, Sequelize)
  const Configuration = ConfigurationModel(sequelize, Sequelize)
  const RegistrationQuestionSet = RegistrationQuestionSetModel(sequelize, Sequelize)
  const ReviewQuestionSet = ReviewQuestionSetModel(sequelize, Sequelize)
  const CustomerReviewQuestionSet = CustomerReviewQuestionSetModel(sequelize, Sequelize)
  const RegistrationManagement = RegistrationManagementModel(sequelize, Sequelize)
  const PeerReview = PeerReviewModel(sequelize, Sequelize)
  const EmailTemplate = EmailTemplateModel(sequelize, Sequelize)
  const CustomerReview = CustomerReviewModel(sequelize, Sequelize)
  const InstructorReview = InstructorReviewModel(sequelize, Sequelize)
  const SentTopicEmail = SentTopicEmailModel(sequelize, Sequelize)

  const Sprint = SprintModel(sequelize, Sequelize)
  const Tag = TagModel(sequelize, Sequelize)
  const TimeLog = TimeLogModel(sequelize, Sequelize)
  const TimeLogTag = TimeLogTagModel(sequelize, Sequelize)

  db.User = User
  db.Group = Group
  db.Topic = Topic
  db.TopicDate = TopicDate
  db.Registration = Registration
  db.Configuration = Configuration
  db.RegistrationQuestionSet = RegistrationQuestionSet
  db.ReviewQuestionSet = ReviewQuestionSet

  db.CustomerReviewQuestionSet = CustomerReviewQuestionSet

  db.RegistrationManagement = RegistrationManagement
  db.PeerReview = PeerReview
  db.EmailTemplate = EmailTemplate
  db.InstructorReview = InstructorReview

  db.CustomerReview = CustomerReview
  db.SentTopicEmail = SentTopicEmail

  db.Sprint = Sprint
  db.Tag = Tag
  db.TimeLog = TimeLog
  db.TimeLogTag = TimeLogTag

  Group.belongsTo(Topic, {
    as: 'topic',
  })
  Group.belongsTo(Configuration, {
    as: 'configuration',
  })
  Group.belongsToMany(User, {
    through: 'group_students',
    as: 'students',
  })
  User.belongsToMany(Group, {
    through: 'group_students',
    as: 'groups',
  })
  Group.belongsTo(User, {
    as: 'instructor',
    foreignKey: 'instructorId',
  })

  PeerReview.belongsTo(User, {
    as: 'user',
    foreignKey: 'user_id',
  })

  PeerReview.belongsTo(Configuration, {
    as: 'configuration',
    foreignKey: 'configuration_id',
  })

  CustomerReview.belongsTo(Group, {
    as: 'group',
    foreignKey: 'group_id',
  })
  CustomerReview.belongsTo(Topic, {
    as: 'topic',
    foreignKey: 'topic_id',
  })
  Topic.hasMany(CustomerReview, {
    as: 'customer_review',
    foreignKey: 'topic_id',
  })
  CustomerReview.belongsTo(Configuration, {
    as: 'configuration',
    foreignKey: 'configuration_id',
  })

  Configuration.hasOne(RegistrationManagement, {
    as: 'peer_review_configuration',
    foreignKey: 'peer_review_conf',
  })

  Configuration.hasOne(RegistrationManagement, {
    as: 'project_registration_configuration',
    foreignKey: 'project_registration_conf',
  })

  Configuration.hasOne(RegistrationManagement, {
    as: 'topic_registration_configuration',
    foreignKey: 'topic_registration_conf',
  })

  Topic.belongsTo(Configuration, {
    as: 'configuration',
    foreignKey: 'configuration_id',
  })

  InstructorReview.belongsTo(User, {
    as: 'user',
    foreignKey: 'user_id',
  })

  SentTopicEmail.belongsTo(Topic, {
    as: 'topic',
    foreignKey: 'topic_id',
  })
  Topic.hasMany(SentTopicEmail, {
    as: 'sent_emails',
    foreignKey: 'topic_id',
  })

  Group.hasMany(Sprint, {
    foreignKey: 'group_id',
    as: 'sprints',
  })

  Sprint.belongsTo(Group, {
    foreignKey: 'group_id',
    as: 'group',
  })

  TimeLog.belongsTo(Sprint, {
    foreignKey: 'sprint_id',
    as: 'sprint',
  })

  Sprint.hasMany(TimeLog, {
    foreignKey: 'sprint_id',
    as: 'timeLogs',
  })

  TimeLog.belongsTo(User, {
    foreignKey: 'student_number',
    as: 'student',
  })

  Tag.belongsToMany(TimeLog, {
    through: 'time_log_tags',
    foreignKey: 'tag_id',
    as: 'timeLogs',
  })

  TimeLog.belongsToMany(Tag, {
    through: 'time_log_tags',
    foreignKey: 'time_log_id',
    as: 'tags',
  })

  db.Configuration.associate(db)
  db.Registration.associate(db)

  db.sequelize = sequelize
  db.Sequelize = Sequelize
  sequelize.sync()
}

module.exports = db
