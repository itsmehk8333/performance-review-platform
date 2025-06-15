import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Badge,
  HStack,
  Divider,
  List,
  ListItem,
  ListIcon,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue
} from '@chakra-ui/react';
import { FiAlertTriangle, FiCheck, FiInfo, FiXCircle } from 'react-icons/fi';
import axios from 'axios';

/**
 * Component for displaying sentiment consistency analysis across reviews
 */
const SentimentComparison = ({ reviewId }) => {
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState(null);
  
  const alertBgColor = useColorModeValue('red.50', 'red.900');
  const boxBgColor = useColorModeValue('gray.50', 'gray.700');
  
  useEffect(() => {
    const fetchComparison = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/reviews/${reviewId}/sentiment-comparison`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setComparison(response.data);
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to fetch sentiment comparison');
        console.error('Error fetching sentiment comparison:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (reviewId) {
      fetchComparison();
    }
  }, [reviewId]);
  
  if (loading) {
    return (
      <Box textAlign="center" py={4}>
        <Spinner size="md" />
        <Text mt={2}>Analyzing sentiment patterns...</Text>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <AlertTitle>Error!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (!comparison || !comparison.hasEnoughData) {
    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <AlertTitle>Not enough data</AlertTitle>
        <AlertDescription>
          {comparison?.message || 'There are not enough completed reviews to compare sentiment patterns.'}
        </AlertDescription>
      </Alert>
    );
  }
  
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      default:
        return 'yellow';
    }
  };
  
  const getInconsistencyIcon = (type) => {
    if (type.includes('self_')) return FiInfo;
    if (type.includes('peer_inconsistency')) return FiAlertTriangle;
    return FiXCircle;
  };
  
  return (
    <Box border="1px" borderColor="gray.200" p={4} borderRadius="md" mt={4}>
      <Heading size="md" mb={3}>Sentiment Analysis Comparison</Heading>
      
      <Box mb={4}>
        <Heading size="sm" mb={2}>Review Distribution</Heading>
        <HStack spacing={3}>
          {Object.entries(comparison.reviewCounts).map(([type, count]) => (
            count > 0 && (
              <Badge key={type} colorScheme="blue">
                {count} {type} {count === 1 ? 'review' : 'reviews'}
              </Badge>
            )
          ))}
        </HStack>
      </Box>
      
      {comparison.inconsistencies.length > 0 ? (
        <Box mb={4}>
          <Heading size="sm" mb={2}>
            Detected Inconsistencies ({comparison.inconsistencies.length})
          </Heading>
          <List spacing={2}>
            {comparison.inconsistencies.map((inconsistency, index) => (
              <ListItem key={index}>
                <HStack alignItems="flex-start">
                  <ListIcon 
                    as={getInconsistencyIcon(inconsistency.type)} 
                    color={`${getSeverityColor(inconsistency.severity)}.500`} 
                    mt={1}
                  />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="medium">{inconsistency.description}</Text>
                    <Badge colorScheme={getSeverityColor(inconsistency.severity)} size="sm">
                      {inconsistency.severity} severity
                    </Badge>
                  </VStack>
                </HStack>
              </ListItem>
            ))}
          </List>
        </Box>      ) : (
        <Box mb={4} bg={boxBgColor} p={3} borderRadius="md">
          <List>
            <ListItem>
              <HStack>
                <ListIcon as={FiCheck} color="green.500" />
                <Text>All reviews are consistent in their sentiment.</Text>
              </HStack>
            </ListItem>
          </List>
        </Box>
      )}
      
      <Divider my={3} />
      
      <Box>
        <Heading size="sm" mb={2}>Sentiment By Review Type</Heading>
        <VStack align="stretch" spacing={2}>
          {Object.entries(comparison.sentimentCounts).map(([type, counts]) => (
            <Box key={type} p={2} borderRadius="md" borderWidth="1px">
              <Text fontWeight="medium" mb={1} textTransform="capitalize">{type} Reviews</Text>
              <HStack spacing={3}>
                {counts.positive > 0 && (
                  <Badge colorScheme="green">{counts.positive} positive</Badge>
                )}
                {counts.neutral > 0 && (
                  <Badge colorScheme="gray">{counts.neutral} neutral</Badge>
                )}
                {counts.negative > 0 && (
                  <Badge colorScheme="red">{counts.negative} negative</Badge>
                )}
              </HStack>
            </Box>
          ))}
        </VStack>
      </Box>
    </Box>
  );
};

export default SentimentComparison;
