import React from 'react';
import { Badge, Tooltip, HStack, Icon, Text } from '@chakra-ui/react';
import { FiAlertTriangle } from 'react-icons/fi';

/**
 * Component to display a sentiment analysis badge with optional vagueness tooltip
 */
const SentimentBadge = ({ sentimentLabel, vaguenessFlags, vagueWords }) => {
  // Determine badge color based on sentiment
  const badgeColor = 
    sentimentLabel === 'positive' ? 'green' : 
    sentimentLabel === 'negative' ? 'red' : 
    'gray';
  
  // Format the sentiment label for display
  const displayLabel = sentimentLabel ? sentimentLabel.toUpperCase() : 'NEUTRAL';
  
  // Check if there are vagueness flags
  const hasVagueFlags = vaguenessFlags && vaguenessFlags.length > 0;
  
  return (
    <HStack spacing={1} ml={2}>
      <Badge colorScheme={badgeColor} variant="solid">
        {displayLabel}
      </Badge>
      
      {hasVagueFlags && (
        <Tooltip 
          label={
            <Text>
              This answer contains vague language
              {vagueWords && vagueWords.length > 0 ? (
                <>: <b>{vagueWords.join(', ')}</b></>
              ) : ''}
            </Text>
          }
          placement="top"
          hasArrow
        >
          <Badge colorScheme="orange" variant="subtle">
            <HStack spacing={1}>
              <Icon as={FiAlertTriangle} color="orange.500" />
              <Text fontSize="xs">VAGUE</Text>
            </HStack>
          </Badge>
        </Tooltip>
      )}
    </HStack>
  );
};

export default SentimentBadge;
