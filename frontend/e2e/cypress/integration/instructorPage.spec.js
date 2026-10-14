/* eslint-disable */

const initTests = () => {
  cy.createGroup({
    name: 'Tykittelijät',
    topicId: 1,
    configurationId: 1,
    instructorId: '012345688',
    studentIds: ['012345678', '012345698'],
  })

  cy.createGroup({
    name: 'Kakkostykitys',
    topicId: 3,
    configurationId: 1,
    instructorId: '012345688',
    studentIds: ['012345678', '012345698'],
  })

  cy.createGroup({
    name: 'Kämmäilijät',
    topicId: 2,
    configurationId: 2,
    instructorId: '012345688',
    studentIds: ['012345678', '012345698'],
  })

  const konf1vastaukset1 = {
    peerReviews: [
      {
        user_id: '012345678',
        configuration_id: 1,
        review_round: 1,
        answer_sheet: [
          {
            id: 1,
            type: 'number',
            answer: '3',
            questionHeader: ' Anna tekninen arvosana.',
          },
          {
            id: 2,
            type: 'text',
            answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce at.',
            questionHeader: 'Mitä kaikkea teknistä tää jäbä osas tehdä?',
          },
          {
            id: 3,
            type: 'number',
            answer: '2',
            questionHeader: 'Kurssin arvosana',
          },
          {
            id: 4,
            type: 'radio',
            peers: {
              'Donald John Trump': 3,
              'Timo *Teppo Tellervo Testaaja': 1,
            },
            questionHeader: 'Miten perustelet tämän arvosanan?',
          },
          {
            id: 5,
            type: 'peerReview',
            peers: {
              'Donald John Trump': 'Lorem ipsum dolor sit amet',
              'Timo *Teppo Tellervo Testaaja': '...consectetur adipiscing elit. Fusce at.',
            },
            questionHeader: 'Arviot erikseen ryhmän jäsenistä',
          },
        ],
      },
      {
        user_id: '012345698',
        configuration_id: 1,
        review_round: 1,
        answer_sheet: [
          {
            id: 1,
            type: 'number',
            answer: '4',
            questionHeader: ' Anna tekninen arvosana.',
          },
          {
            id: 2,
            type: 'text',
            answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce at.',
            questionHeader: 'Mitä kaikkea teknistä tää jäbä osas tehdä?',
          },
          {
            id: 3,
            type: 'number',
            answer: '3',
            questionHeader: 'Kurssin arvosana',
          },
          {
            id: 4,
            type: 'radio',
            peers: {
              'Donald John Trump': 2,
              'Timo *Teppo Tellervo Testaaja': 1,
            },
            questionHeader: 'Miten perustelet tämän arvosanan?',
          },
          {
            id: 5,
            type: 'peerReview',
            peers: {
              'Donald John Trump': 'Lorem ipsum dolor sit amet',
              'Timo *Teppo Tellervo Testaaja': '...consectetur adipiscing elit. Fusce at.',
            },
            questionHeader: 'Arviot erikseen ryhmän jäsenistä',
          },
        ],
      },
    ],
  }

  const konf1vastaukset2 = {
    peerReviews: [
      {
        user_id: '012345678',
        configuration_id: 1,
        review_round: 2,
        answer_sheet: [
          {
            id: 1,
            type: 'number',
            answer: '3',
            questionHeader: ' Anna tekninen arvosana.',
          },
          {
            id: 2,
            type: 'text',
            answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce at.',
            questionHeader: 'Mitä kaikkea teknistä tää jäbä osas tehdä?',
          },
          {
            id: 3,
            type: 'number',
            answer: '2',
            questionHeader: 'Kurssin arvosana',
          },
          {
            id: 4,
            type: 'radio',
            peers: {
              'Donald John Trump': 4,
              'Timo *Teppo Tellervo Testaaja': 4,
            },
            questionHeader: 'Miten perustelet tämän arvosanan?',
          },
          {
            id: 5,
            type: 'peerReview',
            peers: {
              'Donald John Trump': 'Lorem ipsum dolor sit amet',
              'Timo *Teppo Tellervo Testaaja': '...consectetur adipiscing elit. Fusce at.',
            },
            questionHeader: 'Arviot erikseen ryhmän jäsenistä',
          },
        ],
      },
      {
        user_id: '012345698',
        configuration_id: 1,
        review_round: 2,
        answer_sheet: [
          {
            id: 1,
            type: 'number',
            answer: '4',
            questionHeader: ' Anna tekninen arvosana.',
          },
          {
            id: 2,
            type: 'text',
            answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce at.',
            questionHeader: 'Mitä kaikkea teknistä tää jäbä osas tehdä?',
          },
          {
            id: 3,
            type: 'number',
            answer: '5',
            questionHeader: 'Kurssin arvosana',
          },
          {
            id: 4,
            type: 'radio',
            peers: {
              'Donald John Trump': 5,
              'Timo *Teppo Tellervo Testaaja': 5,
            },
            questionHeader: 'Miten perustelet tämän arvosanan?',
          },
          {
            id: 5,
            type: 'peerReview',
            peers: {
              'Donald John Trump': 'Lorem ipsum dolor sit amet',
              'Timo *Teppo Tellervo Testaaja': '...consectetur adipiscing elit. Fusce at.',
            },
            questionHeader: 'Arviot erikseen ryhmän jäsenistä',
          },
        ],
      },
    ],
  }

  const konf2vastaukset1 = {
    peerReviews: [
      {
        user_id: '012345678',
        configuration_id: 2,
        review_round: 1,
        answer_sheet: [
          {
            id: 1,
            type: 'number',
            answer: '0',
            questionHeader: ' Anna tekninen arvosana.',
          },
          {
            id: 2,
            type: 'text',
            answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce at.',
            questionHeader: 'Mitä kaikkea teknistä tää jäbä osas tehdä?',
          },
          {
            id: 3,
            type: 'number',
            answer: '0',
            questionHeader: 'Kurssin arvosana',
          },
          {
            id: 4,
            type: 'radio',
            peers: {
              'Donald John Trump': 0,
              'Timo *Teppo Tellervo Testaaja': 0,
            },
            questionHeader: 'Miten perustelet tämän arvosanan?',
          },
          {
            id: 5,
            type: 'peerReview',
            peers: {
              'Donald John Trump': 'Lorem ipsum dolor sit amet',
              'Timo *Teppo Tellervo Testaaja': '...consectetur adipiscing elit. Fusce at.',
            },
            questionHeader: 'Arviot erikseen ryhmän jäsenistä',
          },
        ],
      },
      {
        user_id: '012345698',
        configuration_id: 2,
        review_round: 1,
        answer_sheet: [
          {
            id: 1,
            type: 'number',
            answer: '0',
            questionHeader: ' Anna tekninen arvosana.',
          },
          {
            id: 2,
            type: 'text',
            answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce at.',
            questionHeader: 'Mitä kaikkea teknistä tää jäbä osas tehdä?',
          },
          {
            id: 3,
            type: 'number',
            answer: '0',
            questionHeader: 'Kurssin arvosana',
          },
          {
            id: 4,
            type: 'radio',
            peers: {
              'Donald John Trump': 0,
              'Timo *Teppo Tellervo Testaaja': 0,
            },
            questionHeader: 'Miten perustelet tämän arvosanan?',
          },
          {
            id: 5,
            type: 'peerReview',
            peers: {
              'Donald John Trump': 'Lorem ipsum dolor sit amet',
              'Timo *Teppo Tellervo Testaaja': '...consectetur adipiscing elit. Fusce at.',
            },
            questionHeader: 'Arviot erikseen ryhmän jäsenistä',
          },
        ],
      },
    ],
  }

  cy.createPeerReviews(konf1vastaukset1)
  cy.createPeerReviews(konf1vastaukset2)
  cy.createPeerReviews(konf2vastaukset1)
}

describe('Instructor page', () => {
  before(() => {
    cy.deleteAllGroups()
    cy.deleteAllPeerReviews()
    initTests()
  })

  beforeEach(() => {
    cy.loginAsAdmin()
    cy.visit('/instructorpage')
  })

  it('shows correct url, contains configuration selector and displays its group', () => {
    // submit not successfull, still on same page
    cy.url().should('contain', '/instructorpage')
    cy.get('[data-cy=configuration-selector]').click()
    cy.get('.configuration-menu-item').contains('Konfiguraatio 1').click()
    cy.contains('Tykittelijät')
    cy.contains('3.00')
  })

  it('displays the corresponding groups of each configuration', () => {
    // submit not successfull, still on same page
    cy.get('[data-cy=configuration-selector]').click()
    cy.get('.configuration-menu-item').contains('Konfiguraatio 2').click()
    cy.contains('Kämmäilijät')
    cy.contains('This group has not answered to the second peer review round yet.')
    cy.get('[data-cy=configuration-selector]').click()
    cy.get('.configuration-menu-item').contains('Konfiguraatio 1').click()
    cy.contains('4.00')
  })

  it('is loaded displaying all groups of a configuration', () => {
    cy.get('[data-cy=configuration-selector]').click()
    cy.get('.configuration-menu-item').contains('Konfiguraatio 1').click()
    cy.contains('Tykittelijät')
    cy.contains('Kakkostykitys')
  })

  it('can filter and display only one group at a time', () => {
    cy.get('[data-cy=configuration-selector]').click()
    cy.get('.configuration-menu-item').contains('Konfiguraatio 1').click()

    cy.get('[data-cy=group-selector]').click()
    cy.get('.specified-group-menu-item').contains('Tykittelijät').click()
    cy.contains('Tykittelijät')
    cy.get('body').should('not.contain', 'Kakkostykitys')

    cy.get('[data-cy=group-selector]').click()
    cy.get('.specified-group-menu-item').contains('Kakkostykitys').click()
    cy.contains('Kakkostykitys')
    cy.get('body').should('not.contain', 'Tykittelijät')
  })

  it('can toggle between student and question views', () => {
    cy.get('[data-cy=configuration-selector]').click()
    cy.get('.configuration-menu-item').contains('Konfiguraatio 1').click()
    cy.get('[data-cy=group-selector]').click()
    cy.get('.specified-group-menu-item').contains('Tykittelijät').click()

    cy.contains('Student View').click()
    cy.contains('Question View')
    cy.contains('/ 1st Round')
    cy.contains('Tykittelijät')

    cy.contains('Question View').click()
    cy.contains('Student View')
  })

  after(() => {
    cy.deleteAllGroups()
    cy.deleteAllPeerReviews()
  })
})
