import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Radio,
  Button,
  CircularProgress,
  Typography,
  TextField,
} from '@mui/material'
import {
  updateAIUsageAnswers,
  createAIUsageAnswers,
} from '../../reducers/actions/userAIUsageActions'
import { useEffect } from 'react'
import Markdown from '../common/Markdown'

const initialModelsUsed = {
  claude: false,
  curreChat: false,
  cursor: false,
  copilot: false,
  codex: false,
  other: false,
  otherExamples: '',
}
// options none | consult | generate
const initialHowUsed = {
  understandCode: 'none',
  debugging: 'none',
  features: 'none',
  refactoring: 'none',
  codeReview: 'none',
  planning: 'none',
  uiPlanning: 'none',
  documentation: 'none',
  tests: 'none',
  databases: 'none',
  infra: 'none',
}
const useHow = [
  'understandCode',
  'debugging',
  'features',
  'refactoring',
  'codeReview',
  'planning',
  'uiPlanning',
  'documentation',
  'tests',
  'databases',
  'infra',
]
const modelNames = {
  claude: 'Claude Code',
  curreChat: 'CurreChat',
  cursor: 'Cursor',
  copilot: 'GitHub Copilot',
  codex: 'OpenAI Codex',
  other: 'Muita malleja',
}
// TODO move texts to localization files when created
const questionInfos = {
  what: 'Mitä tekoälymalleja käytit sprintin aikana?',
  main: 'Mihin ja miten käytit generatiivista tekoälyä?',
  mainInfo:
    'Jos käytit tekoälyä enimmäkseen konsulttina (kysyit neuvoa, ideoita tai pieniä koodinpätkiä), ' +
    'mutta **implementoit muutoksia enimmäkseen omakätisesti**, valitse `Konsultoin tekoälyä`. ' +
    'Jos **generoit merkittävän osan** projektiin tuottamastasi koodista/tekstistä tekoälyllä ' +
    '(suoraan agentilla tai kopioit chatista) valitse `Generoin tekoälyllä`.',
}

const questions = {
  understandCode: 'Olemassaolevan koodin ymmärtäminen (oman tai muiden)',
  debugging: 'Debuggaus tai ongelman paikantaminen',
  features: 'Uuden koodin (toiminnallisuuksien) luominen',
  refactoring: 'Olemassaolevan koodin muokkaaminen (esim. virheenkorjaus, toiminnan laajentaminen)',
  codeReview: 'Koodikatselmointi (esim. pull requestien arviointi)',
  planning:
    'Arkkitehtuurin suunnittelu ja toteutus (esim. käytetyt teknologiat, projektin rakenne)',
  uiPlanning: 'Käyttöliittymän suunnittelu ja toteutus',
  documentation: 'Dokumentaation tuottaminen',
  tests: 'Testien tuottaminen',
  databases: 'Infrastruktuurin toteutus ja hallinta (esim. CI/CD-ratkaisut, ympäristöt)',
  infra: 'Tietokannat (esim. hallinta, kyselyt)',
}

const usageOptions = {
  none: 'En käyttänyt',
  consult: 'Konsultoin tekoälyä',
  generating: 'Generoin tekoälyllä',
}

export const UserAIUsageForm = ({ currentSprintId, groupId }) => {
  const sprintData = useSelector((state) => state.userAIUsage?.answersStudent)
  const [modelsUsed, setModelsUsed] = useState(initialModelsUsed)
  const [howUsed, setHowUsed] = useState(initialHowUsed)
  const [otherModels, setOtherModels] = useState('')
  const dispatch = useDispatch()

  useEffect(() => {
    if (sprintData) {
      const currentSprintData = sprintData.filter((usage) => usage.sprintId === currentSprintId)[0]
      setHowUsed(initialHowUsed)
      setModelsUsed(initialModelsUsed)
      if (currentSprintData) {
        setHowUsed(currentSprintData.howUsed)
        setModelsUsed(currentSprintData.modelsUsed)
      }
    }
  }, [sprintData, currentSprintId])

  const handleDirectSave = async (event) => {
    let dataObject = {
      sprint: currentSprintId,
      howUsed,
      modelsUsed,
      groupId,
    }
    if (event.target.value) {
      const valueParts = event.target.value.split('-')
      if (Object.keys(questions).includes(valueParts[0])) {
        const question = valueParts[0]
        howUsed[question] = valueParts[1]
        setHowUsed({ ...howUsed })
        dataObject = {
          ...dataObject,
          howUsed: { ...howUsed },
        }
      } else if (valueParts[1] !== 'otherExamples') {
        modelsUsed[valueParts[0]] = valueParts[1] === 'used'
        setModelsUsed({ ...modelsUsed })
        dataObject = {
          ...dataObject,
          modelsUsed: { ...modelsUsed },
        }
      } else if (valueParts[1] === 'otherExamples' && valueParts[0].length > 0) {
        setModelsUsed({
          ...modelsUsed,
          otherExamples: modelsUsed.otherExamples.concat(
            modelsUsed.otherExamples.length > 0 ? `, ${valueParts[0]}` : valueParts[0],
          ),
        })
        setOtherModels('')
        dataObject = {
          ...dataObject,
          modelsUsed: {
            ...modelsUsed,
            otherExamples: modelsUsed.otherExamples.concat(
              modelsUsed.otherExamples.length > 0 ? `, ${valueParts[0]}` : valueParts[0],
            ),
          },
        }
      }
    }
    const currentSprintData = sprintData?.filter((usage) => usage.sprintId === currentSprintId)[0]
    if (currentSprintData?.sprintId === currentSprintId) {
      dispatch(updateAIUsageAnswers(dataObject))
    } else {
      dispatch(createAIUsageAnswers(dataObject))
    }
  }

  if (!modelsUsed || !howUsed) return <CircularProgress />

  return (
    <>
      <Typography variant="h5">Sprintin aikainen tekoälyn käyttö</Typography>
      <Markdown>
        **Voit päivittää vastauksiasi koko sprintin ajan. Muista tallettaa valintasi.**
      </Markdown>
      <Typography variant="h6">{questionInfos['what']}</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Tekoälymalli</TableCell>
            <TableCell>En käyttänyt</TableCell>
            <TableCell>Käytin</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.keys(modelsUsed)
            .sort()
            .map((model) => {
              return (
                model !== 'otherExamples' && (
                  <TableRow key={model}>
                    <TableCell>{modelNames[model]}</TableCell>
                    <TableCell>
                      <Radio
                        disabled={!currentSprintId}
                        value={`${model}-notUsed`}
                        checked={!modelsUsed[model]}
                        slotProps={{
                          input: { 'aria-label': `${modelNames[model]}-not-used` },
                        }}
                        onChange={handleDirectSave}
                      />
                    </TableCell>
                    <TableCell>
                      <Radio
                        disabled={!currentSprintId}
                        value={`${model}-used`}
                        checked={modelsUsed[model]}
                        slotProps={{
                          input: { 'aria-label': `${modelNames[model]}-used` },
                        }}
                        onChange={handleDirectSave}
                      />
                    </TableCell>
                  </TableRow>
                )
              )
            })}
        </TableBody>
      </Table>
      <br />
      <Typography variant="h6">Jos käytit lisäksi muita malleja, niin mitä ne olivat.</Typography>
      <Typography sx={{ fontWeight: 800 }}>{modelsUsed['otherExamples']}</Typography>
      <br />
      <TextField
        disabled={!currentSprintId}
        fullWidth
        value={otherModels}
        placeholder="Muita malleja"
        error={(modelsUsed.otherExamples + ` , ${otherModels}`).length > 250}
        label={
          (modelsUsed.otherExamples + ` , ${otherModels}`).length > 250
            ? 'Lisäämäsi mallien yhteenlaskettu pituus ylittää 250 merkkiä'
            : ''
        }
        onChange={(event) => setOtherModels(event.target.value)}
      />
      <Button
        disabled={!currentSprintId || (modelsUsed.otherExamples + ` , ${otherModels}`).length > 250}
        sx={{ marginTop: 2, color: 'black', background: 'lightblue' }}
        value={`${otherModels}-otherExamples`}
        onClick={handleDirectSave}
      >
        Lisää muita malleja
      </Button>
      <Typography variant="h5">{questionInfos.main}</Typography>
      <Markdown>{questionInfos.mainInfo}</Markdown>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 250 }}>Kohde</TableCell>
            {Object.keys(usageOptions).map((option) => {
              return (
                <TableCell sx={{ width: 150 }} key={option}>
                  {usageOptions[option]}
                </TableCell>
              )
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {useHow.map((question) => {
            return (
              <TableRow key={question}>
                <TableCell sx={{ width: 250 }}>{questions[question]}</TableCell>
                <TableCell sx={{ width: 150 }}>
                  <Radio
                    disabled={!currentSprintId}
                    onChange={handleDirectSave}
                    value={`${question}-none`}
                    checked={howUsed[question] === 'none'}
                  />
                </TableCell>
                <TableCell sx={{ width: 150 }}>
                  <Radio
                    disabled={!currentSprintId}
                    onChange={handleDirectSave}
                    value={`${question}-consult`}
                    checked={howUsed[question] === 'consult'}
                  />
                </TableCell>
                <TableCell sx={{ width: 150 }}>
                  <Radio
                    disabled={!currentSprintId}
                    onChange={handleDirectSave}
                    value={`${question}-generate`}
                    checked={howUsed[question] === 'generate'}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <br />
      <Button
        disabled={!currentSprintId}
        sx={{ marginBottom: 1, color: 'black', background: 'lightblue' }}
        aria-label="Tallenna tekoälyvastaukset"
        onClick={handleDirectSave}
      >
        Tallenna tekoälyvastaukset
      </Button>
    </>
  )
}
