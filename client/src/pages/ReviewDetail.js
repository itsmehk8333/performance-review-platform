import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Spinner,
  Flex,
  useToast,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Progress,
  Divider,
  Avatar,
  Textarea,
  FormControl,
  FormLabel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Radio,
  RadioGroup,
  Stack,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Tooltip,
  Checkbox,
  CheckboxGroup,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { FiDownload, FiEdit, FiCheck, FiAlertCircle, FiInfo, FiThumbsUp, FiThumbsDown, FiClock, FiAlertTriangle, FiFileText } from 'react-icons/fi';
import { format } from 'date-fns';
import Layout from '../components/Layout';
import { getReview, submitReview, exportReviewPDF, getReviewTemplate, approveReview, rejectReview, recalculateSentiment, summarizeText } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import SentimentBadge from '../components/SentimentBadge';
import SentimentComparison from '../components/SentimentComparison';

const ReviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState(null);
  const [template, setTemplate] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRejectionSubmitting, setIsRejectionSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    ratings: {},
    answers: []
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [summarizingAnswers, setSummarizingAnswers] = useState({});
  const [summaries, setSummaries] = useState({});
  
  useEffect(() => {
    fetchReview();
  }, [id]);
  
  const fetchReview = async () => {
    try {
      setLoading(true);
      const res = await getReview(id);
      
      // Check if the response has data or is the data itself
      const reviewData = res.data || res;
      
      if (!reviewData) {
        toast({
          title: 'Error',
          description: 'Review not found',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
        navigate('/reviews');
        return;
      }
      
      // Check if the cycle info is available
      if (!reviewData.cycleId) {
        toast({
          title: 'Review data incomplete',
          description: 'The review cycle information is missing. Please contact your administrator.',
          status: 'warning',
          duration: 5000,
          isClosable: true
        });
      }
      
      // Initialize form data
      const formInit = {
        content: reviewData.content || '',
        ratings: reviewData.ratings ? Object.fromEntries(
          Object.entries(reviewData.ratings || {}).map(([key, value]) => [key, Number(value)])
        ) : {},
        answers: reviewData.answers || []
      };
        setFormData(formInit);
      setReview(reviewData);
      
      // Debug sentiment data
      console.log('Review data received:', {
        id: reviewData._id,
        overallSentiment: reviewData.overallSentimentLabel,
        hasAnswers: reviewData.answers && reviewData.answers.length,
        answerSamples: reviewData.answers && reviewData.answers.slice(0, 2).map(a => ({
          question: a.questionId,
          sentiment: a.sentimentLabel,
          flags: a.vaguenessFlags
        }))
      });
      
      // Check if user can edit this review
      const canEdit = (
        reviewData.reviewer && 
        user && 
        reviewData.reviewer._id === user._id && 
        reviewData.status !== 'submitted' && 
        reviewData.status !== 'approved'
      );
      
      setIsEditable(canEdit);
      
      // Fetch template if available
      if (reviewData.templateId) {
        try {
          const templateRes = await getReviewTemplate(
            typeof reviewData.templateId === 'object' ? reviewData.templateId._id : reviewData.templateId
          );
          const templateData = templateRes.data || templateRes;
          setTemplate(templateData);
        } catch (err) {
          console.error('Error fetching template:', err);
          toast({
            title: 'Template Error',
            description: 'Could not load the review template',
            status: 'warning',
            duration: 5000,
            isClosable: true
          });
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching review:', err);
      toast({
        title: 'Error',
        description: 'Could not load review data',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      setLoading(false);
    }
  };
  
  const handleExport = async () => {
    try {
      setExportLoading(true);
      const response = await exportReviewPDF(id);
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate a filename
      const revieweeName = review.reviewee ? 
        (typeof review.reviewee === 'object' ? review.reviewee.name : 'Employee') : 
        'Employee';
      
      link.setAttribute('download', `Review_${revieweeName}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setExportLoading(false);
    } catch (err) {
      console.error('Export failed:', err);
      toast({
        title: 'Export failed',
        description: 'Could not generate PDF export',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      setExportLoading(false);
    }
  };
  
  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await approveReview(id);
      toast({
        title: 'Review approved',
        description: 'The review has been approved successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      fetchReview(); // Refresh data after approval
    } catch (err) {
      toast({
        title: 'Error approving review',
        description: err.response?.data?.msg || 'Something went wrong',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Rejection reason required',
        description: 'Please provide a reason for rejecting this review',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    try {
      setIsRejectionSubmitting(true);
      console.log(`Rejecting review ${id} with reason: ${rejectionReason}`);
      await rejectReview(id, rejectionReason);
      toast({
        title: 'Review rejected',
        description: 'The review has been sent back for revision.',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      setIsRejecting(false);
      setRejectionReason("");
      fetchReview(); // Refresh data after rejection
    } catch (err) {
      console.error('Error rejecting review:', err);
      toast({
        title: 'Error rejecting review',
        description: err.response?.data?.msg || 'Something went wrong',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsRejectionSubmitting(false);
    }
  };
    const renderAnswer = (question, answer) => {
    if (!answer || !question) return null;
    
    // Add Sentiment Badge for text answers
    const showSentimentBadge = question.type === 'open-ended' && 
                               answer.textValue && 
                               answer.sentimentLabel;
    
    switch (question.type) {
      case 'rating':
        return (
          <Box mt={2}>
            <Text mb={2}>
              Rating: {answer.ratingValue || 'Not rated'} / {question.ratingScale?.max || 5}
              {!isEditable && showSentimentBadge && (
                <SentimentBadge 
                  sentimentLabel={answer.sentimentLabel}
                  vaguenessFlags={answer.vaguenessFlags}
                />
              )}
            </Text>
          </Box>
        );
        case 'open-ended':
        const answerId = `${question._id}`;
        const textValue = answer.textValue || '';
        const isLongText = textValue.length > 100;
        
        return (
          <Box mt={2}>
            <Text whiteSpace="pre-wrap">
              {textValue || 'No response provided'}
              {!isEditable && showSentimentBadge && (
                <SentimentBadge 
                  sentimentLabel={answer.sentimentLabel}
                  vaguenessFlags={answer.vaguenessFlags}
                />
              )}
            </Text>
            
            {isLongText && !isEditable && (
              <Box mt={2}>
                <Button
                  size="sm"
                  colorScheme="blue"
                  variant="outline"
                  leftIcon={<FiFileText />}
                  onClick={() => handleSummarize(answerId, textValue)}
                  isLoading={summarizingAnswers[answerId]}
                  isDisabled={summarizingAnswers[answerId]}
                  mb={2}
                >
                  Summarize
                </Button>
                  {summaries[answerId] && (
                  <Box 
                    mt={2} 
                    p={3} 
                    bg="blue.50" 
                    borderRadius="md"
                    borderLeft="4px solid" 
                    borderColor="blue.500"
                  >
                    <Text fontWeight="bold" fontSize="md" color="blue.700" mb={2}>
                      Summary Analysis:
                    </Text>
                    
                    <Box mb={2}>
                      <Text fontWeight="bold" color="blue.700">Key Themes:</Text>
                      <Text>{summaries[answerId].keyThemes}</Text>
                    </Box>
                    
                    <Box mb={2}>
                      <Text fontWeight="bold" color="blue.700">Strengths / Weaknesses:</Text>
                      <Text>{summaries[answerId].strengthsWeaknesses}</Text>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="bold" color="blue.700">Impact Statements:</Text>
                      <Text>{summaries[answerId].impactStatements}</Text>
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        );
      
      case 'multiple-choice':
        return (
          <Box mt={2}>
            <VStack align="start">
              {(answer.selectedOptions || []).map((option, i) => (
                <Text key={i}>• {option}</Text>
              ))}
              {(answer.selectedOptions || []).length === 0 && (
                <Text color="gray.500">No options selected</Text>
              )}
            </VStack>
          </Box>
        );
        
      default:
        return <Text>Unknown question type</Text>;
    }
  };
    const handleSummarize = async (id, text) => {
    try {
      if (!text || text.length < 50) {
        toast({
          title: 'Text too short',
          description: 'The text is too short to summarize',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      setSummarizingAnswers(prev => ({...prev, [id]: true}));
      
      const response = await summarizeText(text);
      
      setSummaries(prev => ({
        ...prev,
        [id]: response.data.summary
      }));
      
      toast({
        title: 'Summary generated',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.msg || 'Failed to generate summary',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSummarizingAnswers(prev => ({...prev, [id]: false}));
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <Flex justify="center" align="center" minH="60vh">
          <Spinner size="xl" />
        </Flex>
      </Layout>
    );
  }

  if (!review) {
    return (
      <Layout>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle mr={2}>Review Not Found</AlertTitle>
          <AlertDescription>The review could not be loaded.</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">
            {review.type && review.type.charAt(0).toUpperCase() + review.type.slice(1)} Review
          </Heading>
          <HStack>
            <Button
              leftIcon={<FiDownload />}
              colorScheme="blue"
              variant="outline"
              onClick={handleExport}
              isLoading={exportLoading}
            >
              Export PDF
            </Button>
          </HStack>
        </Flex>
        
        {/* Review Details */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
          <Card>
            <CardHeader>
              <Heading size="md">Review Information</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                <Box>
                  <Text fontWeight="bold">Reviewee</Text>
                  <Text>{review.reviewee?.name || 'Unknown'}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Reviewer</Text>
                  <Text>{review.reviewer?.name || 'Unknown'}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Review Type</Text>
                  <Badge colorScheme="blue">{review.type && review.type.toUpperCase()}</Badge>
                </Box>
                <Box>
                  <Text fontWeight="bold">Status</Text>
                  <Badge 
                    colorScheme={
                      review.status === 'submitted' ? 'green' : 
                      review.status === 'approved' ? 'purple' :
                      review.status === 'rejected' ? 'red' :
                      review.status === 'in_progress' ? 'orange' :
                      'gray'
                    }
                  >
                    {review.status && review.status.toUpperCase()}
                  </Badge>
                </Box>
                {review.submittedAt && (
                  <Box>
                    <Text fontWeight="bold">Submitted</Text>
                    <Text>{format(new Date(review.submittedAt), 'PPP')}</Text>
                  </Box>
                )}
              </SimpleGrid>
            </CardBody>
          </Card>
          
          <Card>
            <CardHeader>
              <Heading size="md">Approval Status</Heading>
            </CardHeader>
            <CardBody>
              <Flex align="center" mb={4}>
                <Badge 
                  colorScheme={
                    review.approvalStatus === 'approved' ? 'green' :
                    review.approvalStatus === 'rejected' ? 'red' :
                    'yellow'
                  } 
                  fontSize="md" 
                  p={2}
                  variant="solid"
                  borderRadius="md"
                >
                  <Flex align="center">
                    <Icon 
                      as={
                        review.approvalStatus === 'approved' ? FiThumbsUp :
                        review.approvalStatus === 'rejected' ? FiThumbsDown :
                        FiClock
                      } 
                      mr={2} 
                    />
                    {review.approvalStatus?.toUpperCase()}
                  </Flex>
                </Badge>
              </Flex>
              
              {review.approvedBy && review.approvedAt && (
                <Text fontSize="sm" color="gray.600">
                  Approved by {review.approvedBy.name} on {format(new Date(review.approvedAt), 'MMM d, yyyy')}
                </Text>
              )}
              
              {review.rejectionReason && (
                <Alert status="warning" mt={4}>
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Rejection Reason</AlertTitle>
                    <AlertDescription>{review.rejectionReason}</AlertDescription>
                  </Box>
                </Alert>
              )}
            </CardBody>
          </Card>
        </SimpleGrid>
        
        {/* Approval/Rejection buttons for managers */}
        {review && (review.status === 'submitted' || review.approvalStatus === 'pending') && user && user.isManager && review.approvalStatus !== 'approved' && (
          <Card mt={6}>
            <CardHeader>
              <Heading size="md">Manager Approval</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {review.approvalStatus === 'rejected' ? (
                  <Alert status="warning">
                    <AlertIcon />
                    This review was rejected. The reviewer needs to address the feedback.
                  </Alert>
                ) : (
                  <>
                    <Text>As a manager, you can approve this review or send it back for revision.</Text>
                    <HStack spacing={4}>
                      <Button
                        leftIcon={<FiThumbsUp />}
                        colorScheme="green"
                        onClick={handleApprove}
                        isLoading={isApproving}
                        isDisabled={isRejecting}
                      >
                        Approve Review
                      </Button>
                      <Button
                        leftIcon={<FiThumbsDown />}
                        colorScheme="red"
                        onClick={() => setIsRejecting(!isRejecting)}
                        isDisabled={isApproving}
                      >
                        {isRejecting ? 'Cancel' : 'Reject Review'}
                      </Button>
                    </HStack>
                    
                    {isRejecting && (
                      <VStack spacing={4} align="stretch" mt={4}>
                        <FormControl isRequired>
                          <FormLabel>Rejection Reason</FormLabel>
                          <Textarea
                            placeholder="Provide feedback on why this review needs revision..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                          />
                        </FormControl>
                        <Button 
                          colorScheme="red" 
                          onClick={handleReject}
                          isLoading={isRejectionSubmitting}
                          isDisabled={!rejectionReason.trim() || isRejectionSubmitting}
                        >
                          Send Back for Revision
                        </Button>
                      </VStack>
                    )}
                  </>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}
        
        {/* Review Content */}
        <Card mt={6}>
          <CardHeader>
            <Heading size="md">Review Content</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">              {/* Only used for old reviews without structured format */}
              {review.content && !review.answers?.length && (
                <>
                  <Text whiteSpace="pre-wrap">{review.content}</Text>
                  
                  {review.content.length > 200 && (
                    <Box mt={3}>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                        leftIcon={<FiFileText />}
                        onClick={() => handleSummarize('main-content', review.content)}
                        isLoading={summarizingAnswers['main-content']}
                        isDisabled={summarizingAnswers['main-content']}
                        mb={2}
                      >
                        Summarize
                      </Button>
                        {summaries['main-content'] && (
                        <Box 
                          mt={2} 
                          p={3} 
                          bg="blue.50" 
                          borderRadius="md"
                          borderLeft="4px solid" 
                          borderColor="blue.500"
                        >
                          <Text fontWeight="bold" fontSize="md" color="blue.700" mb={2}>
                            Summary Analysis:
                          </Text>
                          
                          <Box mb={2}>
                            <Text fontWeight="bold" color="blue.700">Key Themes:</Text>
                            <Text>{summaries['main-content'].keyThemes}</Text>
                          </Box>
                          
                          <Box mb={2}>
                            <Text fontWeight="bold" color="blue.700">Strengths / Weaknesses:</Text>
                            <Text>{summaries['main-content'].strengthsWeaknesses}</Text>
                          </Box>
                          
                          <Box>
                            <Text fontWeight="bold" color="blue.700">Impact Statements:</Text>
                            <Text>{summaries['main-content'].impactStatements}</Text>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}
                </>
              )}
              
              {/* For structured reviews with template questions */}
              {review.answers && review.answers.length > 0 && template && template.questions && (
                <>
                  {template.questions.map((question) => {
                    const answer = review.answers.find(a => a.questionId === question._id);
                    return (
                      <Box key={question._id} p={4} borderWidth="1px" borderRadius="md">
                        <Text fontWeight="bold">{question.text}</Text>
                        {renderAnswer(question, answer)}
                        
                        {/* Summarization button for open-ended questions */}
                        {question.type === 'open-ended' && (
                          <HStack mt={2}>
                            <Button
                              leftIcon={<FiFileText />}
                              size="sm"
                              colorScheme="teal"
                              onClick={() => handleSummarize(question._id, answer.textValue)}
                              isLoading={summarizingAnswers[question._id]}
                            >
                              Summarize Answer
                            </Button>
                            
                            {/* Show summary if available */}
                            {summaries[question._id] && (
                              <Text fontSize="sm" color="gray.600" whiteSpace="pre-wrap">
                                {summaries[question._id]}
                              </Text>
                            )}
                          </HStack>
                        )}
                      </Box>
                    );
                  })}
                </>
              )}
              
              {/* Display ratings for legacy reviews */}
              {Object.keys(review.ratings || {}).length > 0 && (
                <Box>
                  <Heading size="sm" mb={4}>Ratings</Heading>
                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                    {Object.entries(review.ratings).map(([key, value]) => (
                      <Box key={key}>
                        <Text fontSize="sm" fontWeight="semibold">{key}</Text>
                        <Flex align="center">
                          <Progress 
                            value={value * 20} 
                            colorScheme={value >= 4 ? 'green' : value >= 3 ? 'blue' : 'orange'} 
                            size="sm" 
                            flex="1"
                            mr={2} 
                          />
                          <Badge>{value}/5</Badge>
                        </Flex>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
              )}
              
              {/* No content warning */}
              {!review.content && (!review.answers || review.answers.length === 0) && 
               (!review.ratings || Object.keys(review.ratings).length === 0) && (
                <Alert status="info">
                  <AlertIcon />
                  This review does not have any content yet.
                </Alert>
              )}              {/* Overall Sentiment Analysis Badge */}
              {review.overallSentimentLabel && (
                <Box mt={4} border="1px" borderColor="gray.200" p={4} borderRadius="md">
                  <Heading size="sm" mb={2}>Content Analysis</Heading>
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Text fontWeight="bold">Overall Tone:</Text>
                      <SentimentBadge 
                        sentimentLabel={review.overallSentimentLabel}
                        vaguenessFlags={review.overallVaguenessFlags}
                        vagueWords={review.vagueWords}
                      />
                    </HStack>
                    
                    {/* Debug info - visible to all to make testing easier */}
                    <Box mt={2} p={2} bg="gray.50" borderRadius="md" w="100%">
                      <Text fontSize="sm" fontWeight="bold">Analysis Debug:</Text>
                      <Text fontSize="xs">Sentiment: {review.overallSentimentLabel || 'none'}</Text>
                      <Text fontSize="xs">Vagueness flags: {review.overallVaguenessFlags ? review.overallVaguenessFlags.join(', ') : 'none'}</Text>
                      <Text fontSize="xs">Vague words detected: {review.vagueWords ? review.vagueWords.join(', ') : 'none'}</Text>
                    </Box>
                  </VStack>
                </Box>
              )}
                {/* Debug: Missing Sentiment Data */}
              {!review.overallSentimentLabel && review.status === 'submitted' && (
                <Box mt={4} border="1px" borderColor="red.200" p={4} borderRadius="md" bg="red.50">
                  <Heading size="sm" mb={2}>Debug: Sentiment Data Missing</Heading>
                  <Text>Status: {review.status}</Text>
                  <Text>Submitted At: {new Date(review.submittedAt).toLocaleString()}</Text>                  <Button 
                    mt={2} 
                    size="sm" 
                    colorScheme="red" 
                    onClick={async () => {                      try {
                        setLoading(true);
                        const response = await recalculateSentiment(id);
                        if (response.data) {
                          setReview(response.data);
                          toast({
                            title: 'Sentiment recalculated',
                            description: `Overall sentiment: ${response.data.overallSentimentLabel || 'none'}`,
                            status: 'success',
                            duration: 5000,
                            isClosable: true
                          });
                        }
                      } catch (error) {                        console.error('Error recalculating sentiment:', error);
                        toast({
                          title: 'Error',
                          description: error.response?.data?.msg || 'Failed to recalculate sentiment',
                          status: 'error',
                          duration: 5000,
                          isClosable: true
                        });
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Recalculate Sentiment
                  </Button>                </Box>
              )}
              
              {/* Sentiment Comparison - For completed reviews only */}
              {review.status === 'submitted' && review.overallSentimentLabel && (
                <SentimentComparison reviewId={id} />
              )}
            </VStack>
          </CardBody>
        </Card>
      </Box>
    </Layout>
  );
};

export default ReviewDetail;
