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
  Badge,
  Button,
  Spinner,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  Select,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  IconButton,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid
} from '@chakra-ui/react';
import { FiUsers, FiUserPlus, FiEdit, FiUpload, FiDownload, FiRefreshCw } from 'react-icons/fi';
import Layout from '../components/Layout';
import { getOrgChart, getDirectReports, getAllReports, updateUserManager, updateUserDepartment, bulkUpdateOrgData, importOrgChart } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const OrgChart = () => {
  const [orgData, setOrgData] = useState([]);
  const [directReports, setDirectReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const { isOpen: isManagerModalOpen, onOpen: onManagerModalOpen, onClose: onManagerModalClose } = useDisclosure();
  const { isOpen: isImportModalOpen, onOpen: onImportModalOpen, onClose: onImportModalClose } = useDisclosure();
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  useEffect(() => {
    fetchOrgData();
  }, []);

  const fetchOrgData = async () => {
    try {
      setLoading(true);
      
      // Get organization chart data
      const orgResponse = await getOrgChart();
      setOrgData(orgResponse.data);

      // Get direct reports
      const directResponse = await getDirectReports();
      setDirectReports(directResponse.data);

      // Get all reports (direct + indirect)
      const allResponse = await getAllReports();
      setAllReports(allResponse.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching org data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch organization data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  const handleUpdateManager = async (userId, managerId) => {
    try {
      await updateUserManager(userId, managerId);
      
      toast({
        title: 'Manager updated',
        description: 'The reporting relationship has been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchOrgData(); // Refresh the data
      onManagerModalClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update manager',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdateDepartment = async (userId, department) => {
    try {
      await updateUserDepartment(userId, department);
      
      toast({
        title: 'Department updated',
        description: 'The department has been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchOrgData(); // Refresh the data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update department',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const handleImportOrgChart = async () => {
    if (!csvFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a CSV file to import',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvData = e.target.result;
        await importOrgChart(csvData);
        
        toast({
          title: 'Import successful',
          description: 'Organization chart data has been imported successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        fetchOrgData(); // Refresh the data
        onImportModalClose();
      };
      reader.readAsText(csvFile);
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error.response?.data?.msg || 'Failed to import organization chart data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const renderOrgHierarchy = (userData, depth = 0) => {
    if (!userData) return null;

    const children = orgData.filter(u => u.managerId === userData._id);
    
    return (
      <Box key={userData._id} ml={depth * 4}>
        <Card mb={2} borderLeft="4px" borderColor={depth === 0 ? "green.400" : depth === 1 ? "blue.400" : "purple.400"}>
          <CardBody py={2}>
            <HStack spacing={3} justify="space-between">
              <HStack>
                <Avatar size="sm" name={userData.name} src={userData.avatar} />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold">{userData.name}</Text>
                  <Text fontSize="xs" color="gray.500">{userData.title || userData.role?.name || 'No title'}</Text>
                </VStack>
              </HStack>
              <HStack>
                {userData.department && (
                  <Badge colorScheme="blue">{userData.department}</Badge>
                )}
                {isAdmin && (
                  <IconButton
                    icon={<FiEdit />}
                    size="sm"
                    variant="ghost"
                    aria-label="Edit reporting relationship"
                    onClick={() => {
                      setSelectedUser(userData);
                      onManagerModalOpen();
                    }}
                  />
                )}
              </HStack>
            </HStack>
          </CardBody>
        </Card>
        {children.length > 0 && (
          <Box pl={4} borderLeft="1px" borderColor="gray.200" ml={2}>
            {children.map(child => renderOrgHierarchy(child, depth + 1))}
          </Box>
        )}
      </Box>
    );
  };

  const renderReportsTable = (reports, title) => (
    <Card mb={6}>
      <CardHeader>
        <Heading size="md">
          <HStack>
            <FiUsers />
            <Text>{title} ({reports.length})</Text>
          </HStack>
        </Heading>
      </CardHeader>
      <CardBody>
        {reports.length > 0 ? (
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Title</Th>
                <Th>Department</Th>
              </Tr>
            </Thead>
            <Tbody>
              {reports.map(person => (
                <Tr key={person._id}>
                  <Td>
                    <HStack>
                      <Avatar size="xs" name={person.name} src={person.avatar} />
                      <Text>{person.name}</Text>
                    </HStack>
                  </Td>
                  <Td>{person.title || 'N/A'}</Td>
                  <Td>{person.department || 'N/A'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <Text>No {title.toLowerCase()} found.</Text>
        )}
      </CardBody>
    </Card>
  );

  if (loading) {
    return (
      <Layout>
        <Flex justify="center" align="center" h="200px">
          <Spinner size="xl" />
        </Flex>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box mb={8}>
        <HStack justify="space-between" mb={6} wrap="wrap">
          <Heading size="lg">Organization Chart</Heading>
          {isAdmin && (
            <HStack>
              <Button
                leftIcon={<FiUpload />}
                colorScheme="teal"
                onClick={onImportModalOpen}
              >
                Import Org Data
              </Button>
              <Button
                leftIcon={<FiRefreshCw />}
                colorScheme="blue"
                onClick={fetchOrgData}
                isLoading={loading}
              >
                Refresh
              </Button>
            </HStack>
          )}
        </HStack>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          <VStack align="stretch" spacing={6}>
            <Card>
              <CardHeader>
                <Heading size="md">Organization Hierarchy</Heading>
              </CardHeader>
              <CardBody>
                {orgData.length > 0 ? (
                  <Box maxH="600px" overflowY="auto" pr={2}>
                    {orgData.filter(u => !u.managerId).map(topLevelUser => renderOrgHierarchy(topLevelUser))}
                  </Box>
                ) : (
                  <Alert status="info">
                    <AlertIcon />
                    <AlertTitle>No org chart data available</AlertTitle>
                    <AlertDescription>
                      The organization chart hasn't been configured yet.
                    </AlertDescription>
                  </Alert>
                )}
              </CardBody>
            </Card>
          </VStack>
          
          <VStack align="stretch" spacing={6}>
            {renderReportsTable(directReports, "Direct Reports")}
            {renderReportsTable(allReports, "All Reports (Direct + Indirect)")}
          </VStack>
        </SimpleGrid>
      </Box>

      {/* Manager Assignment Modal */}
      <Modal isOpen={isManagerModalOpen} onClose={onManagerModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Update Reporting Relationship</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedUser && (
              <VStack spacing={4} align="stretch">
                <HStack>
                  <Avatar size="md" name={selectedUser.name} src={selectedUser.avatar} />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">{selectedUser.name}</Text>
                    <Text fontSize="sm">{selectedUser.title || selectedUser.role?.name || 'No title'}</Text>
                  </VStack>
                </HStack>
                
                <FormControl>
                  <FormLabel>Manager</FormLabel>
                  <Select 
                    placeholder="Select manager"
                    defaultValue={selectedUser.managerId || ""}
                    onChange={(e) => handleUpdateManager(selectedUser._id, e.target.value || null)}
                  >
                    <option value="">No Manager</option>
                    {orgData
                      .filter(u => u._id !== selectedUser._id)
                      .map(u => (
                        <option key={u._id} value={u._id}>
                          {u.name} - {u.title || u.role?.name || 'No title'}
                        </option>
                      ))
                    }
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Department</FormLabel>
                  <Input 
                    placeholder="Department name"
                    defaultValue={selectedUser.department || ""}
                    onChange={(e) => handleUpdateDepartment(selectedUser._id, e.target.value)}
                  />
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onManagerModalClose}>
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={isImportModalOpen} onClose={onImportModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Import Organization Chart</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info" mb={4}>
                <AlertIcon />
                <Box>
                  <AlertTitle>CSV Format</AlertTitle>
                  <AlertDescription>
                    The CSV should have columns: userId, managerId, department
                  </AlertDescription>
                </Box>
              </Alert>
              
              <FormControl>
                <FormLabel>CSV File</FormLabel>
                <Input type="file" accept=".csv" onChange={handleFileChange} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onImportModalClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleImportOrgChart}>
              Import
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default OrgChart;
