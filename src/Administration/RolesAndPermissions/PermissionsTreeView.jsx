// import React from 'react';
// // import { TreeView, TreeItem } from '@mui/lab';
// // import { TreeView, TreeItem } from '@mui/x-tree-view'
// import Switch from '@mui/material/Switch';
// import Button from '@mui/material/Button';
// import { ExpandMore as ExpandMoreIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';

// function PermissionTreeView({ permissionMasterData, moduleEnabledStates, toggleModule, choosePermission }) {
//   const renderTree = (nodes) => (
//     <TreeItem key={nodes.moduleCode} nodeId={nodes.moduleCode} label={nodes.moduleName}>
//       {Array.isArray(nodes.submodules) ? nodes.submodules.map((submodule) => (
//         <TreeItem key={submodule.moduleCode} nodeId={submodule.moduleCode} label={submodule.moduleName}>
//           {Array.isArray(submodule.moduleScreenMap) ? submodule.moduleScreenMap.map((screen, index) => (
//             <TreeItem key={index} nodeId={`${submodule.moduleCode}-${index}`} label={screen.screenName}>
//               {Array.isArray(screen.components) && (
//                 <ul>
//                   {screen.components.map((component, compIndex) => (
//                     <li key={compIndex}>
//                       <span>{component.componentName}</span>
//                       <Button
//                         onClick={() => choosePermission(nodes.moduleCode, submodule.moduleCode, index, compIndex, 'allow')}
//                         variant="contained"
//                         color={screen.accessType === 'allow' ? 'primary' : 'default'}
//                       >
//                         Allow
//                       </Button>
//                       <Button
//                         onClick={() => choosePermission(nodes.moduleCode, submodule.moduleCode, index, compIndex, 'deny')}
//                         variant="contained"
//                         color={screen.accessType === 'deny' ? 'secondary' : 'default'}
//                       >
//                         Deny
//                       </Button>
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </TreeItem>
//           )) : null}
//         </TreeItem>
//       )) : null}
//     </TreeItem>
//   );

//   return (
//     <TreeView
//       defaultCollapseIcon={<ExpandMoreIcon />}
//       defaultExpandIcon={<ChevronRightIcon />}
//     >
//       {permissionMasterData.map((masterData) => (
//         <TreeItem key={masterData.moduleCode} nodeId={masterData.moduleCode} label={masterData.moduleName}>
//           <Switch
//             checked={moduleEnabledStates[masterData.moduleCode]}
//             onChange={() => toggleModule(masterData.moduleCode)}
//             inputProps={{ 'aria-label': 'primary checkbox' }}
//           />
//           {renderTree(masterData)}
//         </TreeItem>
//       ))}
//     </TreeView>
//   );
// }

// export default PermissionTreeView;
