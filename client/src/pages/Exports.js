import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Button,
  Spinner,
  Flex,
  Select,
  FormControl,
  FormLabel,
  useToast,
  SimpleGrid,
  Icon,
  Divider,
  Radio,
  RadioGroup,
  Checkbox,
  CheckboxGroup,
  Stack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { FiDownload, FiFileText, FiUsers, FiBarChart2 } from 'react-icons/fi';
import Layout from '../components/Layout';
import { getReviewCycles, getUsers, exportReviews, exportFeedback } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Exports = () => {
  const [cycles, setCycles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState({
    exportType: 'reviews',
    cycleId: '',
    format: 'csv',
    includeRatings: true,
    includeComments: true,
    filterByUser: false,
    userId: ''
  });
  
  const toast = useToast();
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cyclesData, usersData] = await Promise.all([
          getReviewCycles(),
          getUsers()
        ]);
        
        setCycles(cyclesData);
        setUsers(usersData);
        
        if (cyclesData.length > 0) {
          setFormData(prev => ({ ...prev, cycleId: cyclesData[0]._id }));
        }
        
        setLoading(false);
      } catch (err) {
        toast({
          title: 'Error fetching data',
          description: err.response?.data?.msg || 'Something went wrong',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };
  
  const handleExport = async () => {
    try {
      setExporting(true);
      
      if (formData.exportType === 'reviews') {
        await exportReviews({
          cycleId: formData.cycleId,
          format: formData.format,
          includeRatings: formData.includeRatings,
          includeComments: formData.includeComments,
          userId: formData.filterByUser ? formData.userId : null
        });
      } else {
        await exportFeedback({
          format: formData.format,
          userId: formData.filterByUser ? formData.userId : null
        });
      }
      
      toast({
        title: 'Export successful',
        description: `The ${formData.exportType} have been exported to ${formData.format.toUpperCase()}`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (err) {
      toast({
        title: 'Export failed',
        description: err.response?.data?.msg || 'Something went wrong',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setExporting(false);
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <Flex justify="center" align="center" h="50vh">
          <Spinner size="xl" />
        </Flex>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <Box mb={6}>
        <Heading size="lg" mb={6}>
          Export Data
        </Heading>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
          <Card>
            <CardHeader>
              <HStack>
                <Icon as={FiBarChart2} boxSize={5} />
                <Heading size="md">Export Configuration</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={5} align="stretch">
                <FormControl>
                  <FormLabel>Export Type</FormLabel>
                  <RadioGroup 
                    value={formData.exportType} 
                    onChange={(value) => handleInputChange('exportType', value)}
                  >
                    <Stack direction="row" spacing={5}>
                      <Radio value="reviews">
                        <HStack>
                          <Icon as={FiUsers} />
                          <Text>Reviews</Text>
                        </HStack>
                      </Radio>
                      <Radio value="feedback">
                        <HStack>
                          <Icon as={FiFileText} />
                          <Text>Feedback</Text>
                        </HStack>
                      </Radio>
                    </Stack>
                  </RadioGroup>
                </FormControl>
                
                <Divider />
                
                {formData.exportType === 'reviews' && (
                  <FormControl>
                    <FormLabel>Review Cycle</FormLabel>
                    <Select 
                      value={formData.cycleId} 
                      onChange={(e) => handleInputChange('cycleId', e.target.value)}
                    >
                      {cycles.map((cycle) => (
                        <option key={cycle._id} value={cycle._id}>
                          {cycle.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                )}
                
                <FormControl>
                  <FormLabel>File Format</FormLabel>
                  <RadioGroup 
                    value={formData.format} 
                    onChange={(value) => handleInputChange('format', value)}
                  >
                    <Stack direction="row" spacing={5}>
                      <Radio value="csv">CSV</Radio>
                      <Radio value="pdf">PDF</Radio>
                    </Stack>
                  </RadioGroup>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Filter by User</FormLabel>
                  <Checkbox 
                    isChecked={formData.filterByUser} 
                    onChange={(e) => handleInputChange('filterByUser', e.target.checked)}
                  >
                    Filter by specific user
                  </Checkbox>
                  
                  {formData.filterByUser && (
                    <Select 
                      mt={3} 
                      placeholder="Select user" 
                      value={formData.userId} 
                      onChange={(e) => handleInputChange('userId', e.target.value)}
                    >
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </Select>
                  )}
                </FormControl>
                
                {formData.exportType === 'reviews' && (
                  <FormControl>
                    <FormLabel>Content Options</FormLabel>
                    <CheckboxGroup>
                      <Stack spacing={2}>
                        <Checkbox 
                          isChecked={formData.includeRatings} 
                          onChange={(e) => handleInputChange('includeRatings', e.target.checked)}
                        >
                          Include Ratings
                        </Checkbox>
                        <Checkbox 
                          isChecked={formData.includeComments} 
                          onChange={(e) => handleInputChange('includeComments', e.target.checked)}
                        >
                          Include Written Feedback
                        </Checkbox>
                      </Stack>
                    </CheckboxGroup>
                  </FormControl>
                )}
              </VStack>
            </CardBody>
          </Card>
          
          <Card>
            <CardHeader>
              <HStack>
                <Icon as={FiDownload} boxSize={5} />
                <Heading size="md">Export Summary</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle fontWeight="bold">Export Details</AlertTitle>
                    <AlertDescription>
                      <VStack align="stretch" mt={2} spacing={1}>
                        <Text>
                          <strong>Type:</strong> {formData.exportType === 'reviews' ? 'Performance Reviews' : 'Continuous Feedback'}
                        </Text>
                        {formData.exportType === 'reviews' && (
                          <Text>
                            <strong>Cycle:</strong> {cycles.find(c => c._id === formData.cycleId)?.name || 'All Cycles'}
                          </Text>
                        )}
                        <Text>
                          <strong>Format:</strong> {formData.format.toUpperCase()}
                        </Text>
                        {formData.filterByUser && (
                          <Text>
                            <strong>User:</strong> {users.find(u => u._id === formData.userId)?.name || 'Selected User'}
                          </Text>
                        )}
                        {formData.exportType === 'reviews' && (
                          <Text>
                            <strong>Content:</strong> {[
                              formData.includeRatings ? 'Ratings' : null,
                              formData.includeComments ? 'Comments' : null
                            ].filter(Boolean).join(', ')}
                          </Text>
                        )}
                      </VStack>
                    </AlertDescription>
                  </Box>
                </Alert>
                
                <Box>
                  <Text fontSize="sm" mb={4}>
                    This export will contain data that may include personal information. Please ensure you're complying with your organization's data privacy policies.
                  </Text>
                  
                  <Button
                    leftIcon={<FiDownload />}
                    colorScheme="blue"
                    size="lg"
                    width="full"
                    onClick={handleExport}
                    isLoading={exporting}
                    loadingText="Exporting..."
                  >
                    Export {formData.format.toUpperCase()}
                  </Button>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Box>
    </Layout>
  );
};

export default Exports;
