import React from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Topic from './Topic'
import Typography from '@mui/material/Typography'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'

class TopicDialog extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      open: false,
    }

    this.handleClose = this.handleClose.bind(this)
  }

  handleClose = () => {
    this.setState({ open: false })
  }

  render() {
    const isSummer =
      this.props.topic.content.summerDates &&
      (this.props.topic.content.summerDates.short || this.props.topic.content.summerDates.long)

    const padding = isSummer ? '10px' : '15px'

    const isNotOpenSorce =
      this.props.topic.content.organisation === 'company' &&
      this.props.topic.content.ipRights === 'nonopen'
    const ipRights = isNotOpenSorce
      ? 'The customer retains the intellectual property rights to the project'
      : 'Software is published under an open source license'

    return (
      <Card style={{ margin: '2px', minHeight: '78px' }}>
        <CardContent
          style={{
            padding,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {this.props.showDragIcon && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px',
                color: '#888',
                flexShrink: 0,
              }}
            >
              <DragIndicatorIcon />
            </div>
          )}
          <div style={{ flex: 4 }}>
            <Typography style={{ flex: 1, fontWeight: 'bold' }}>
              {this.props.topic.content.title}
            </Typography>
            <Typography style={{ flex: 1, fontWeight: 'bold' }}>
              Customer: {this.props.topic.content.customerName}
            </Typography>
            {isNotOpenSorce && (
              <Typography style={{ flex: 1, fontWeight: 'bold', fontStyle: 'italic' }}>
                {ipRights}
              </Typography>
            )}
            {isSummer && (
              <Typography style={{ flex: 1, fontWeight: 'bold' }}>
                {this.props.topic.content.summerDates.short && 'early summer'}
                {this.props.topic.content.summerDates.short &&
                this.props.topic.content.summerDates.long
                  ? ', '
                  : ''}
                {this.props.topic.content.summerDates.long && 'whole summer'}
              </Typography>
            )}
          </div>
          <Button
            variant="outlined"
            style={{ flex: 1, maxHeight: '42px' }}
            onClick={() => this.setState({ open: true })}
          >
            Details
          </Button>
        </CardContent>
        <Dialog open={this.state.open} onClose={this.handleClose} scroll={this.state.scroll}>
          <DialogContent>
            <Topic content={this.props.topic.content} />
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClose} variant="outlined">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Card>
    )
  }
}

export default TopicDialog
