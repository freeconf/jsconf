
const m = {
    module: {
        ident: 'x',
        dataDef: [
            {
                ident: 'l',
                leaf: {
                    type: {
                        ident: 'string',
                        format: 'string'
                    }
                }
            },
            {
                ident: 'c',
                container: {
                    dataDef: [
                        {
                            ident: 'l2',
                            leaf: {
                                type: {
                                    ident: 'int32',
                                    format: 'int32'
                                }
                            }
                        }
                    ]
                }
            }
        ]
    }
};
